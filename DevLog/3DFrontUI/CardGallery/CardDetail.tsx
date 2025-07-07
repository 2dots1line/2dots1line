import React, { useState, useEffect, useRef, useCallback } from "react";

interface CardData {
  id: string;
  img: string;
  title: string;
  subtitle: string;
  category?: string;
}

interface CardDetailProps {
  card: CardData;
  onClose: () => void;
  onNavigate: (direction: 'left' | 'right') => void;
  relatedCards: CardData[];
}

export default function CardDetail({ card, onClose, onNavigate, relatedCards }: CardDetailProps) {
  // 3D Globe rotation system - now supports free camera rotation
  const [cameraRotation, setCameraRotation] = useState({ x: 0, y: 0 }); // Camera rotation in degrees - perfectly level
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isManualControl, setIsManualControl] = useState(false); // Track if user is manually controlling camera
  const [hasDraggedSignificantly, setHasDraggedSignificantly] = useState(false); // Track if user has actually dragged
  const [totalDragDistance, setTotalDragDistance] = useState(0); // Track total drag distance
  const [selectedCardDetail, setSelectedCardDetail] = useState<any>(null); // Track clicked card for detail view
  const [videoLoaded, setVideoLoaded] = useState(false); // Track if background video has loaded
  
  // Center card rotation animation state - REMOVED to prevent spinning issues
  const containerRef = useRef<HTMLDivElement>(null);

  const globeRadius = 500; // Radius of the globe - spacing for larger cards

  // All cards exist as fixed objects arranged around a 3D globe's equator
  const allCardsIn3D = relatedCards.map((cardData, index) => {
    const totalCards = relatedCards.length;
    
    // Calculate position around the equator (Y = 0 for equator)
    const angle = (index / totalCards) * 2 * Math.PI; // Evenly space cards around circle
    const x = Math.cos(angle) * globeRadius; // X position on circle
    const y = 0; // All cards on equator (Y = 0)
    const z = Math.sin(angle) * globeRadius; // Z position on circle
    
    // Calculate rotation to face OUTWARD toward user (front-facing)
    // Use atan2 to calculate rotation to face away from center (toward user)
    const rotationY = Math.atan2(x, z) * 180 / Math.PI; // Face outward toward user
    
    return {
      ...cardData,
      absoluteIndex: index,
      positionInSpace: index,
      x3d: x,
      y3d: y,
      z3d: z,
      angle: angle,
      rotationY: rotationY // Store rotation for facing center
    };
  });

  // Function to rotate to focus on a specific card
  const focusOnCard = useCallback((targetCard: any) => {
    // Only auto-focus if user is not manually controlling the camera
    if (isManualControl) return;
    
    // Calculate camera rotation to face the target card
    const targetAngle = targetCard.angle * 180 / Math.PI;
    setCameraRotation(prev => ({
      ...prev,
      y: -targetAngle // Rotate camera to face the card
    }));
  }, [isManualControl]);

  // Initialize camera to focus on clicked card (only on first load)
  useEffect(() => {
    const targetCard = allCardsIn3D.find(c => c.id === card.id);
    if (targetCard && !isManualControl) {
      focusOnCard(targetCard);
    }
  }, [card.id, focusOnCard, allCardsIn3D, isManualControl]);

  // Auto-open card detail view when coming from collection view
  useEffect(() => {
    // Automatically open the detail view for the clicked card
    setSelectedCardDetail(card);
  }, [card]);

  // Force video to play when component mounts
  useEffect(() => {
    const video = document.querySelector('video[key="carddetail-bg-video"]') as HTMLVideoElement;
    if (video) {
      video.load();
      video.play().catch(e => console.log('Video autoplay failed:', e));
    }
  }, []);

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // Reset manual control when using arrow keys for navigation
        setIsManualControl(false);
        
        // Find current focused card and move to next/previous
        const currentIndex = allCardsIn3D.findIndex(c => c.id === card.id);
        const totalCards = allCardsIn3D.length;
        
        let nextIndex;
        if (e.key === 'ArrowRight') {
          nextIndex = (currentIndex + 1) % totalCards;
        } else {
          nextIndex = (currentIndex - 1 + totalCards) % totalCards;
        }
        
        const nextCard = allCardsIn3D[nextIndex];
        focusOnCard(nextCard);
      }
    };
    
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  }, [onClose, focusOnCard, allCardsIn3D, card.id]);

  // Handle click outside to close - RE-ENABLED for card detail view
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (selectedCardDetail) {
      setSelectedCardDetail(null); // Close card detail view
    }
    // Globe view click-to-close remains disabled
  };

  // Handle detail card content click to prevent closing
  const handleDetailContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Handle card click to show detailed backside view
  const handleCardClick = (cardData: any, e: React.MouseEvent) => {
    e.stopPropagation();
    // Don't open detail if currently dragging OR if user has recently dragged significantly
    if (isDragging || hasDraggedSignificantly) return;
    setSelectedCardDetail(cardData);
  };

  // Auto-rotation for background cards when detail view is open
  const [autoRotationAngle, setAutoRotationAngle] = useState(0);
  
  useEffect(() => {
    if (!selectedCardDetail) return;
    
    const interval = setInterval(() => {
      setAutoRotationAngle(prev => prev + 0.5); // Slower constant speed rotation (50% of original)
    }, 16); // 60fps for smooth rotation
    
    return () => clearInterval(interval);
  }, [selectedCardDetail]);

  // Reset auto-rotation when exiting detail view to prevent sharp transitions
  useEffect(() => {
    if (!selectedCardDetail) {
      setAutoRotationAngle(0); // Reset to 0 when detail view closes
    }
  }, [selectedCardDetail]);

  // Free camera rotation with mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsManualControl(true); // Enable manual control when user starts dragging
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOffset({ x: 0, y: 0 });
    // Reset drag tracking
    setHasDraggedSignificantly(false);
    setTotalDragDistance(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y; // Track Y movement for distance calculation
    
    // Calculate total drag distance to determine if this is a significant drag
    const dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    setTotalDragDistance(dragDistance);
    
    // Mark as significant drag if moved more than 10 pixels
    if (dragDistance > 10) {
      setHasDraggedSignificantly(true);
    }
    
    // Convert mouse movement to rotation with sensitivity - only horizontal rotation
    const sensitivity = 0.5;
    // const rotationDeltaX = deltaY * sensitivity; // Disabled vertical rotation
    const rotationDeltaY = deltaX * sensitivity; // Mouse X controls camera Y rotation (left/right around equator)
    
    setDragOffset({ x: 0, y: rotationDeltaY }); // Only allow Y rotation
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    // Apply the drag offset to the camera rotation - only horizontal
    setCameraRotation(prev => ({
      x: prev.x, // Keep vertical rotation fixed
      y: prev.y + dragOffset.y // Allow free horizontal rotation around equator
    }));
    
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    
    // Add a delay before clearing drag protection to prevent accidental clicks
    // Only clear if this was a significant drag
    if (hasDraggedSignificantly) {
      setTimeout(() => {
        setHasDraggedSignificantly(false);
      }, 400); // 400ms delay to prevent accidental clicks after drag
    }
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setIsManualControl(true); // Enable manual control when user starts dragging
    setDragStart({ x: touch.clientX, y: touch.clientY });
    setDragOffset({ x: 0, y: 0 });
    // Reset drag tracking
    setHasDraggedSignificantly(false);
    setTotalDragDistance(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = touch.clientY - dragStart.y; // Track Y movement for distance calculation
    
    // Calculate total drag distance to determine if this is a significant drag
    const dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    setTotalDragDistance(dragDistance);
    
    // Mark as significant drag if moved more than 10 pixels
    if (dragDistance > 10) {
      setHasDraggedSignificantly(true);
    }
    
    const sensitivity = 0.5;
    // const rotationDeltaX = deltaY * sensitivity; // Disabled vertical rotation
    const rotationDeltaY = deltaX * sensitivity; // Only horizontal rotation around equator
    
    setDragOffset({ x: 0, y: rotationDeltaY }); // Only allow Y rotation
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  // Center card rotation animation effect - REMOVED to prevent spinning issues

  return (
    <div className="fixed inset-0 z-50">
      {/* 2D Background Layer - completely separate from 3D transforms */}
      <div className="absolute inset-0 z-0">
        {/* Background Video - same as collection view */}
        <video
          key="carddetail-bg-video" // Force re-render when component mounts
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onLoadStart={() => {
            console.log('CardDetail video loading started');
            setVideoLoaded(false);
          }}
          onLoadedData={() => {
            console.log('CardDetail video loaded successfully');
            setVideoLoaded(true);
          }}
          onCanPlayThrough={() => {
            console.log('CardDetail video can play through');
            setVideoLoaded(true);
          }}
          onError={(e) => {
            console.error('CardDetail video error:', e);
            setVideoLoaded(false);
          }}
          style={{
            backgroundColor: '#87CEEB', // Fallback color while loading
            zIndex: 1
          }}
        >
          <source src="/assets/Cloud1.mp4" type="video/mp4" />
        </video>
        
        {/* Fallback Animated Cloud Background - always show initially, hide when video loads */}
        <div 
          className="absolute inset-0 pointer-events-none bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600"
          style={{
            opacity: videoLoaded ? 0 : 1,
            transition: 'opacity 0.5s ease-in-out',
            zIndex: 0
          }}
        >
          <div className="absolute inset-0 opacity-30">
            <div className="w-full h-full" style={{
              backgroundImage: `
                radial-gradient(ellipse 120px 80px at 15% 20%, rgba(255, 255, 255, 0.8) 40%, transparent 50%),
                radial-gradient(ellipse 100px 60px at 25% 60%, rgba(255, 255, 255, 0.6) 40%, transparent 50%),
                radial-gradient(ellipse 140px 90px at 35% 30%, rgba(255, 255, 255, 0.7) 40%, transparent 50%),
                radial-gradient(ellipse 90px 70px at 45% 80%, rgba(255, 255, 255, 0.5) 40%, transparent 50%)
              `,
              animation: 'cloudDrift 60s linear infinite'
            }}></div>
          </div>
        </div>
      </div>

      {/* 3D Scene Container */}
      <div 
        className="absolute inset-0 z-10 flex items-center justify-center"
        onClick={handleBackdropClick}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          perspective: '1200px', // 3D perspective for the entire scene
          perspectiveOrigin: 'center center'
        }}
      >
      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-8 right-8 z-60 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* 3D Globe centered in screen with free camera rotation */}
      <div 
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `
            rotateX(${cameraRotation.x + dragOffset.x}deg)
            rotateY(${cameraRotation.y + dragOffset.y + (selectedCardDetail ? autoRotationAngle : 0)}deg)
          `,
          transition: isDragging ? 'none' : 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Globe wireframe and equator - hidden from user view (internal reference only) */}

        {(() => {
          // Calculate current camera rotation 
          const currentCameraY = cameraRotation.y + dragOffset.y + (selectedCardDetail ? autoRotationAngle : 0);
          
          // Apply camera rotation to all cards and find the one with highest z value
          let centerCardId: string | null = null;
          let maxRotatedZ = -Infinity;
          
          allCardsIn3D.forEach(card => {
            // Convert camera rotation to radians (negative because we're rotating the view, not the world)
            const cameraRadians = (-currentCameraY * Math.PI) / 180;
            
            // Apply rotation matrix to get card position relative to current camera view
            const rotatedX = card.x3d * Math.cos(cameraRadians) - card.z3d * Math.sin(cameraRadians);
            const rotatedZ = card.x3d * Math.sin(cameraRadians) + card.z3d * Math.cos(cameraRadians);
            
            // Find the card with highest z value after rotation (closest to user in current view)
            if (rotatedZ > maxRotatedZ) {
              maxRotatedZ = rotatedZ;
              centerCardId = card.id;
            }
          });
          
          return allCardsIn3D.map((cardData) => {
          // Hide the selected card when detail view is open
          if (selectedCardDetail && cardData.id === selectedCardDetail.id) {
            return null;
          }
          
          // Use pre-calculated globe positions
          const x = cardData.x3d;
          const y = cardData.y3d;
          const z = cardData.z3d;
          
          // Check if this is the default/clicked card (should be facing viewer)
          const isDefaultCard = cardData.id === card.id;
          
          // Calculate how close this card is to the center of the user's screen
          // The user is looking straight ahead at the center of the screen
          const currentCameraY = cameraRotation.y + dragOffset.y + (selectedCardDetail ? autoRotationAngle : 0);
          const cardAngleInDegrees = cardData.angle * 180 / Math.PI;
          
          // Normalize currentCameraY to 0-360 range for accurate card positioning calculations
          // This ensures infinite rotation works properly without breaking visibility calculations
          let normalizedCameraY = currentCameraY % 360;
          if (normalizedCameraY < 0) normalizedCameraY += 360;
          
          // Adjust center reference point clockwise by adding offset
          const centerOffset = 60; // Adjust clockwise by 60 degrees
          const adjustedCameraY = normalizedCameraY + centerOffset;
          
          // Calculate the angular distance from the center of the user's view
          // Cards at the center of screen should have angle difference of 0
          let angleDifferenceFromCenter = cardAngleInDegrees - adjustedCameraY;
          
          // Normalize to -180 to +180 range
          while (angleDifferenceFromCenter > 180) angleDifferenceFromCenter -= 360;
          while (angleDifferenceFromCenter < -180) angleDifferenceFromCenter += 360;
          
          // Calculate distance factor: 0 = center of screen (max scale), 180 = opposite side (min scale)
          const distanceFromCenter = Math.abs(angleDifferenceFromCenter);
          
          // Convert to a scale factor: closer to center = larger scale
          const centerProximity = 1 - (distanceFromCenter / 180); // 1 = center, 0 = opposite side
          
          // Dynamic scaling based on proximity to screen center
          let scale;
          if (centerProximity > 0.9) { // Very center cards
            scale = 1.2 + (centerProximity - 0.9) * 2; // Scale 1.2 to 1.4 for center cards
          } else if (centerProximity > 0.7) { // Near center cards
            scale = 0.9 + (centerProximity - 0.7) * 1.5; // Scale 0.9 to 1.2
          } else if (centerProximity > 0.5) { // Side cards
            scale = 0.6 + (centerProximity - 0.5) * 1.5; // Scale 0.6 to 0.9
          } else if (centerProximity > 0.3) { // Far side cards
            scale = 0.4 + (centerProximity - 0.3) * 1; // Scale 0.4 to 0.6
          } else {
            // Very far/back cards
            scale = 0.2 + centerProximity * 0.67; // Scale 0.2 to 0.4
          }
          
          // Dynamic opacity based on proximity to screen center
          let opacity;
          if (centerProximity > 0.8) { // Center cards
            opacity = 1.0; // Fully visible
          } else if (centerProximity > 0.5) { // Side cards
            opacity = 0.7 + (centerProximity - 0.5) * 1; // Opacity 0.7 to 1.0
          } else if (centerProximity > 0.2) { // Far cards
            opacity = 0.4 + (centerProximity - 0.2) * 1; // Opacity 0.4 to 0.7
          } else {
            opacity = 0.2 + centerProximity * 1; // Opacity 0.2 to 0.4
          }
          
          // Z-index based on proximity to center (center cards should be on top)
          let zIndex = Math.round(100 + centerProximity * 50);
          
          // Dynamic center card detection: card with highest z value (closest to user)
          const isCenterCard = cardData.id === centerCardId; // Only the specific card with maximum z value
          
          // Center card detection - no animation to avoid spinning issues
          
          // Add subtle pop effect for center card
          let finalScale = scale;
          if (isCenterCard) {
            finalScale = scale * 1.25; // 25% size increase for center card pop effect
          }
          
          // Cards face toward the center of the globe, EXCEPT center card which faces the screen
          let rotationY, rotationX;
          if (isCenterCard) {
            // Center card (highest z value) faces flat toward the screen (no tilt, no flip)
            // Counter-rotate to cancel out the container rotation
            rotationY = -currentCameraY; // Negative of container rotation to face screen flat
            rotationX = 0;
          } else {
            // Normal cards face toward the center of the globe
            rotationY = cardData.rotationY;
            rotationX = 0;
          }
          
          return (
            <div
              key={cardData.id}
              className="absolute"
              style={{
                transform: `
                  translate3d(${x}px, ${y}px, ${z}px) 
                  rotateY(${rotationY}deg) 
                  rotateX(${rotationX}deg)
                `,
                opacity: selectedCardDetail ? opacity * 0.5 : opacity, // More fade when detail view is open
                zIndex,
                transformOrigin: 'center center',
                transformStyle: 'preserve-3d',
                // CSS transitions removed - now using JavaScript animation for smoother center card rotation
              }}
              onClick={(e) => handleCardClick(cardData, e)}
            >
              {/* Card with enhanced styling for default card and center card */}
              <div 
                className={`relative w-48 h-48 rounded-2xl overflow-hidden backdrop-blur-xl cursor-pointer hover:scale-105 select-none ${
                  isDefaultCard 
                    ? 'border-2 border-white/40 shadow-2xl shadow-white/20' // Default card gets special border and glow
                    : 'border border-white/20 shadow-xl shadow-black/40'     // Other cards get standard styling
                }`}
                style={{
                  transform: `scale(${finalScale})`,
                  transformOrigin: 'center center',
                  transformStyle: 'preserve-3d',
                  userSelect: 'none',
                  // CSS transitions removed - using JavaScript animation for rotation
                }}
              >
                {/* Background image */}
                <div className="absolute inset-0">
                  <img
                    src={cardData.img}
                    alt={cardData.title}
                    className="w-full h-full object-cover select-none"
                    draggable={false}
                    style={{ userSelect: 'none' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>

                {/* Content overlay with enhanced styling for default card */}
                <div className="absolute inset-0 flex flex-col justify-end p-3">
                  <div className="text-center">
                    <h2 className={`font-bold text-white mb-1 transition-all duration-500 ${
                      isDefaultCard ? 'text-lg drop-shadow-lg' : 'text-base'
                    }`}>
                      {cardData.title}
                    </h2>
                    <p className={`text-white/80 transition-all duration-500 ${
                      isDefaultCard ? 'text-sm drop-shadow-md' : 'text-xs'
                    }`}>
                      {cardData.subtitle}
                    </p>
                  </div>
                </div>


              </div>
            </div>
          );
          });
        })()}

        {/* Current card info - HIDDEN */}
      </div>

      {/* Card counter */}
      <div className="absolute top-8 left-8 bg-white/10 backdrop-blur-md rounded-xl px-6 py-3 border border-white/20 pointer-events-none">
        <p className="text-white/80 text-base">
          {relatedCards.length} Cards on Globe
        </p>
      </div>

      {/* Individual Card Detail View Overlay */}
      {selectedCardDetail && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center"
          onClick={handleBackdropClick}
          style={{
            perspective: '1200px'
          }}
        >
          

                                {/* Enlarged Card Detail - Flipped to show backside */}
           <div 
             className="relative w-[600px] h-[400px] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/30"
             style={{
               transform: 'rotateY(180deg)', // Flipped to show backside
               transformStyle: 'preserve-3d'
             }}
             onClick={handleDetailContentClick}
           >
             {/* Backside Content */}
             <div 
               className="absolute inset-0 text-white"
               style={{
                 transform: 'rotateY(180deg)', // Flip content back to readable orientation
                 transformStyle: 'preserve-3d'
               }}
             >
               {/* Card's actual image as background */}
               <div className="absolute inset-0">
                 <img
                   src={selectedCardDetail.img}
                   alt={selectedCardDetail.title}
                   className="w-full h-full object-cover"
                   draggable={false}
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
               </div>
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="w-full h-full bg-grid-pattern"></div>
              </div>
              
              {/* Content */}
              <div className="relative z-10 p-8 h-full flex flex-col">
                {/* Header */}
                <div className="text-center mb-6">
                  <h1 className="text-4xl font-bold mb-2 text-white drop-shadow-lg">
                    {selectedCardDetail.title}
                  </h1>
                  <p className="text-xl text-white/80 font-light">
                    {selectedCardDetail.subtitle}
                  </p>
                </div>
                
                {/* Main Content */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-8 w-full">
                    {/* Left Column - Key Topics */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-blue-300">Key Topics</h3>
                      <ul className="space-y-2 text-white/90">
                        <li>• Fundamentals & Core Concepts</li>
                        <li>• Advanced Techniques</li>
                        <li>• Practical Applications</li>
                        <li>• Industry Standards</li>
                        <li>• Latest Developments</li>
                      </ul>
                    </div>
                    
                    {/* Right Column - Learning Path */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-green-300">Learning Path</h3>
                      <div className="space-y-2 text-white/90">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                          <span>Beginner Level</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-yellow-400 rounded-full mr-3"></div>
                          <span>Intermediate Level</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-400 rounded-full mr-3"></div>
                          <span>Advanced Level</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-purple-400 rounded-full mr-3"></div>
                          <span>Expert Level</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="text-center pt-6 border-t border-white/20">
                  <p className="text-white/60 text-sm">
                    Click anywhere outside to return to globe view
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
} 