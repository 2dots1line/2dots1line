import React, { useState, useMemo, useCallback } from "react";
import "./InfiniteCanvas.css";
import CardDetail from "./CardDetail";

// Different themed collections for the makeover button
const imageCollections = [
  {
    name: "Professional & Modern",
    source: "Unsplash Professional",
    cards: [
      { img: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop&crop=entropy", title: "Mathematics", subtitle: "Advanced Calculus" },
      { img: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop&crop=entropy", title: "Programming", subtitle: "Code & Logic" },
      { img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=entropy", title: "Languages", subtitle: "Global Communication" },
      { img: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop&crop=entropy", title: "History", subtitle: "Ancient Wisdom" },
      { img: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=400&fit=crop&crop=entropy", title: "Physics", subtitle: "Quantum Mechanics" },
      { img: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=400&fit=crop&crop=entropy", title: "Chemistry", subtitle: "Molecular Science" },
      { img: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=400&fit=crop&crop=entropy", title: "Geometry", subtitle: "Sacred Patterns" },
      { img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=entropy", title: "Music", subtitle: "Audio Production" },
      { img: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=400&fit=crop&crop=entropy", title: "Astronomy", subtitle: "Space & Stars" },
      { img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=400&fit=crop&crop=entropy", title: "Finance", subtitle: "Market Analytics" },
      { img: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop&crop=entropy", title: "Technology", subtitle: "Digital Innovation" },
      { img: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop&crop=entropy", title: "Health", subtitle: "Wellness & Fitness" },
      { img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=entropy", title: "Sports", subtitle: "Athletic Performance" },
      { img: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop&crop=entropy", title: "Art", subtitle: "Creative Expression" },
      { img: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=400&fit=crop&crop=entropy", title: "Design", subtitle: "Visual Aesthetics" },
      { img: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=400&fit=crop&crop=entropy", title: "Business", subtitle: "Strategic Growth" },
      { img: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=400&fit=crop&crop=entropy", title: "Psychology", subtitle: "Mind & Behavior" },
      { img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=400&fit=crop&crop=entropy", title: "Social", subtitle: "Human Connection" },
      { img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&crop=entropy", title: "Cooking", subtitle: "Culinary Arts" },
      { img: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=400&fit=crop&crop=entropy", title: "Travel", subtitle: "Global Adventures" },
    ]
  },
  {
    name: "Dark & Moody",
    source: "Unsplash Dark Collection",
    cards: [
      { img: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop&crop=entropy&sat=-50", title: "Mathematics", subtitle: "Advanced Calculus" },
      { img: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&h=400&fit=crop&crop=entropy", title: "Programming", subtitle: "Code & Logic" },
      { img: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop&crop=entropy&sat=-30", title: "Languages", subtitle: "Global Communication" },
      { img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=entropy&sat=-40", title: "History", subtitle: "Ancient Wisdom" },
      { img: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=400&fit=crop&crop=entropy", title: "Physics", subtitle: "Quantum Mechanics" },
      { img: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=400&fit=crop&crop=entropy&sat=-20", title: "Chemistry", subtitle: "Molecular Science" },
      { img: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=400&fit=crop&crop=entropy&sat=-30", title: "Geometry", subtitle: "Sacred Patterns" },
      { img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=entropy&sat=-40", title: "Music", subtitle: "Audio Production" },
      { img: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=400&fit=crop&crop=entropy&sat=-20", title: "Astronomy", subtitle: "Space & Stars" },
      { img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=400&fit=crop&crop=entropy&sat=-30", title: "Finance", subtitle: "Market Analytics" },
      { img: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop&crop=entropy&sat=-40", title: "Technology", subtitle: "Digital Innovation" },
      { img: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop&crop=entropy&sat=-30", title: "Health", subtitle: "Wellness & Fitness" },
      { img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=entropy&sat=-20", title: "Sports", subtitle: "Athletic Performance" },
      { img: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop&crop=entropy&sat=-40", title: "Art", subtitle: "Creative Expression" },
      { img: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=400&fit=crop&crop=entropy&sat=-30", title: "Design", subtitle: "Visual Aesthetics" },
      { img: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=400&fit=crop&crop=entropy&sat=-50", title: "Business", subtitle: "Strategic Growth" },
      { img: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=400&fit=crop&crop=entropy&sat=-20", title: "Psychology", subtitle: "Mind & Behavior" },
      { img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=400&fit=crop&crop=entropy&sat=-40", title: "Social", subtitle: "Human Connection" },
      { img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&crop=entropy&sat=-30", title: "Cooking", subtitle: "Culinary Arts" },
      { img: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=400&fit=crop&crop=entropy&sat=-20", title: "Travel", subtitle: "Global Adventures" },
    ]
  },
  {
    name: "Vibrant & Colorful",
    source: "Unsplash Vibrant Collection",
    cards: [
      { img: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop&crop=entropy&sat=50&vibrance=30", title: "Mathematics", subtitle: "Advanced Calculus" },
      { img: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop&crop=entropy&sat=40", title: "Programming", subtitle: "Code & Logic" },
      { img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=entropy&sat=60", title: "Languages", subtitle: "Global Communication" },
      { img: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop&crop=entropy&sat=50", title: "History", subtitle: "Ancient Wisdom" },
      { img: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=400&fit=crop&crop=entropy&sat=40", title: "Physics", subtitle: "Quantum Mechanics" },
      { img: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=400&fit=crop&crop=entropy&sat=70", title: "Chemistry", subtitle: "Molecular Science" },
      { img: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=400&fit=crop&crop=entropy&sat=50", title: "Geometry", subtitle: "Sacred Patterns" },
      { img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=entropy&sat=60", title: "Music", subtitle: "Audio Production" },
      { img: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=400&fit=crop&crop=entropy&sat=40", title: "Astronomy", subtitle: "Space & Stars" },
      { img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=400&fit=crop&crop=entropy&sat=50", title: "Finance", subtitle: "Market Analytics" },
      { img: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop&crop=entropy&sat=60", title: "Technology", subtitle: "Digital Innovation" },
      { img: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop&crop=entropy&sat=70", title: "Health", subtitle: "Wellness & Fitness" },
      { img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=entropy&sat=50", title: "Sports", subtitle: "Athletic Performance" },
      { img: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop&crop=entropy&sat=80", title: "Art", subtitle: "Creative Expression" },
      { img: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=400&fit=crop&crop=entropy&sat=60", title: "Design", subtitle: "Visual Aesthetics" },
      { img: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=400&fit=crop&crop=entropy&sat=40", title: "Business", subtitle: "Strategic Growth" },
      { img: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=400&fit=crop&crop=entropy&sat=50", title: "Psychology", subtitle: "Mind & Behavior" },
      { img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=400&fit=crop&crop=entropy&sat=60", title: "Social", subtitle: "Human Connection" },
      { img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&crop=entropy&sat=70", title: "Cooking", subtitle: "Culinary Arts" },
      { img: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=400&fit=crop&crop=entropy&sat=50", title: "Travel", subtitle: "Global Adventures" },
    ]
  },
  {
    name: "Minimalist & Clean",
    source: "Pexels Minimal Collection",
    cards: [
      { img: "https://images.pexels.com/photos/6238297/pexels-photo-6238297.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", title: "Mathematics", subtitle: "Advanced Calculus" },
      { img: "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", title: "Programming", subtitle: "Code & Logic" },
      { img: "https://images.pexels.com/photos/256417/pexels-photo-256417.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", title: "Languages", subtitle: "Global Communication" },
      { img: "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", title: "History", subtitle: "Ancient Wisdom" },
      { img: "https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", title: "Physics", subtitle: "Quantum Mechanics" },
      { img: "https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", title: "Chemistry", subtitle: "Molecular Science" },
      { img: "https://images.pexels.com/photos/1181472/pexels-photo-1181472.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", title: "Geometry", subtitle: "Sacred Patterns" },
      { img: "https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", title: "Music", subtitle: "Audio Production" },
      { img: "https://images.pexels.com/photos/2156/sky-earth-space-working.jpg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", title: "Astronomy", subtitle: "Space & Stars" },
      { img: "https://images.pexels.com/photos/259027/pexels-photo-259027.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", title: "Finance", subtitle: "Market Analytics" },
      { img: "https://images.pexels.com/photos/1181354/pexels-photo-1181354.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", title: "Technology", subtitle: "Digital Innovation" },
      { img: "https://images.pexels.com/photos/40751/running-runner-long-distance-fitness-40751.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", title: "Health", subtitle: "Wellness & Fitness" },
      { img: "https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", title: "Sports", subtitle: "Athletic Performance" },
      { img: "https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", title: "Art", subtitle: "Creative Expression" },
      { img: "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", title: "Design", subtitle: "Visual Aesthetics" },
      { img: "https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", title: "Business", subtitle: "Strategic Growth" },
      { img: "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", title: "Psychology", subtitle: "Mind & Behavior" },
      { img: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", title: "Social", subtitle: "Human Connection" },
      { img: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", title: "Cooking", subtitle: "Culinary Arts" },
      { img: "https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", title: "Travel", subtitle: "Global Adventures" },
    ]
  },
  {
    name: "Abstract & Artistic",
    source: "Pixabay Abstract Collection",
    cards: [
      { img: "https://cdn.pixabay.com/photo/2016/11/29/05/45/astronomy-1867616_640.jpg", title: "Mathematics", subtitle: "Infinite Patterns" },
      { img: "https://cdn.pixabay.com/photo/2018/05/18/15/30/web-3411373_640.jpg", title: "Programming", subtitle: "Digital Networks" },
      { img: "https://cdn.pixabay.com/photo/2016/10/26/19/00/domain-names-1772242_640.jpg", title: "Languages", subtitle: "Communication Web" },
      { img: "https://cdn.pixabay.com/photo/2017/01/18/16/46/hong-kong-1990268_640.jpg", title: "History", subtitle: "Time Layers" },
      { img: "https://cdn.pixabay.com/photo/2011/12/14/12/21/orion-nebula-11107_640.jpg", title: "Physics", subtitle: "Cosmic Forces" },
      { img: "https://cdn.pixabay.com/photo/2016/10/11/21/43/geometric-1732847_640.jpg", title: "Chemistry", subtitle: "Molecular Dance" },
      { img: "https://cdn.pixabay.com/photo/2016/09/10/17/18/book-1659717_640.jpg", title: "Geometry", subtitle: "Sacred Forms" },
      { img: "https://cdn.pixabay.com/photo/2016/11/29/13/14/attractive-1869761_640.jpg", title: "Music", subtitle: "Sound Waves" },
      { img: "https://cdn.pixabay.com/photo/2011/12/14/12/17/galaxy-11098_640.jpg", title: "Astronomy", subtitle: "Deep Space" },
      { img: "https://cdn.pixabay.com/photo/2016/11/30/12/16/chart-1873765_640.jpg", title: "Finance", subtitle: "Market Flow" },
      { img: "https://cdn.pixabay.com/photo/2018/05/08/08/44/artificial-intelligence-3382507_640.jpg", title: "Technology", subtitle: "AI Networks" },
      { img: "https://cdn.pixabay.com/photo/2017/03/25/17/55/color-2174045_640.png", title: "Health", subtitle: "Life Energy" },
      { img: "https://cdn.pixabay.com/photo/2016/11/29/13/39/beach-1869790_640.jpg", title: "Sports", subtitle: "Motion Blur" },
      { img: "https://cdn.pixabay.com/photo/2017/08/30/01/05/milky-way-2695569_640.jpg", title: "Art", subtitle: "Creative Universe" },
      { img: "https://cdn.pixabay.com/photo/2016/11/21/16/05/black-and-white-1846560_640.jpg", title: "Design", subtitle: "Visual Harmony" },
      { img: "https://cdn.pixabay.com/photo/2016/11/29/06/15/plans-1867745_640.jpg", title: "Business", subtitle: "Strategic Vision" },
      { img: "https://cdn.pixabay.com/photo/2017/06/07/15/56/healing-stones-2380234_640.jpg", title: "Psychology", subtitle: "Mind Patterns" },
      { img: "https://cdn.pixabay.com/photo/2016/11/23/15/48/audience-1853662_640.jpg", title: "Social", subtitle: "Human Networks" },
      { img: "https://cdn.pixabay.com/photo/2017/06/20/22/14/man-2425121_640.jpg", title: "Cooking", subtitle: "Culinary Art" },
      { img: "https://cdn.pixabay.com/photo/2016/11/29/04/19/beach-1867285_640.jpg", title: "Travel", subtitle: "Journey Flow" },
    ]
  },
  {
    name: "Generative & Geometric",
    source: "Lorem Picsum + DiceBear",
    cards: [
      { img: "https://picsum.photos/seed/math1/400/400?blur=1", title: "Mathematics", subtitle: "Random Patterns" },
      { img: "https://api.dicebear.com/7.x/shapes/png?size=400&seed=code1", title: "Programming", subtitle: "Algorithmic Art" },
      { img: "https://picsum.photos/seed/lang1/400/400?grayscale", title: "Languages", subtitle: "Abstract Forms" },
      { img: "https://api.dicebear.com/7.x/bottts/png?size=400&seed=hist1", title: "History", subtitle: "Digital Artifacts" },
      { img: "https://picsum.photos/seed/phys1/400/400?blur=2", title: "Physics", subtitle: "Wave Functions" },
      { img: "https://api.dicebear.com/7.x/identicon/png?size=400&seed=chem1", title: "Chemistry", subtitle: "Molecular Grid" },
      { img: "https://picsum.photos/seed/geo1/400/400", title: "Geometry", subtitle: "Pure Structure" },
      { img: "https://api.dicebear.com/7.x/pixel-art/png?size=400&seed=music1", title: "Music", subtitle: "Digital Harmony" },
      { img: "https://picsum.photos/seed/astro1/400/400?blur=3", title: "Astronomy", subtitle: "Cosmic Noise" },
      { img: "https://api.dicebear.com/7.x/shapes/png?size=400&seed=fin1", title: "Finance", subtitle: "Data Visualization" },
      { img: "https://picsum.photos/seed/tech1/400/400?grayscale&blur=1", title: "Technology", subtitle: "System Patterns" },
      { img: "https://api.dicebear.com/7.x/lorelei/png?size=400&seed=health1", title: "Health", subtitle: "Life Algorithms" },
      { img: "https://picsum.photos/seed/sport1/400/400", title: "Sports", subtitle: "Motion Capture" },
      { img: "https://api.dicebear.com/7.x/miniavs/png?size=400&seed=art1", title: "Art", subtitle: "Generative Design" },
      { img: "https://picsum.photos/seed/design1/400/400?blur=1", title: "Design", subtitle: "Random Beauty" },
      { img: "https://api.dicebear.com/7.x/avataaars/png?size=400&seed=biz1", title: "Business", subtitle: "Corporate Identity" },
      { img: "https://picsum.photos/seed/psych1/400/400?grayscale", title: "Psychology", subtitle: "Mind Mapping" },
      { img: "https://api.dicebear.com/7.x/open-peeps/png?size=400&seed=social1", title: "Social", subtitle: "Human Diversity" },
      { img: "https://picsum.photos/seed/cook1/400/400", title: "Cooking", subtitle: "Recipe Randomness" },
      { img: "https://api.dicebear.com/7.x/adventurer/png?size=400&seed=travel1", title: "Travel", subtitle: "Journey Avatars" },
    ]
  },
  {
    name: "Robotic & Futuristic",
    source: "RoboHash + Lorem.space",
    cards: [
      { img: "https://robohash.org/mathematics1.png?size=400x400", title: "Mathematics", subtitle: "AI Calculator" },
      { img: "https://api.lorem.space/image/ai?w=400&h=400", title: "Programming", subtitle: "Code Robots" },
      { img: "https://robohash.org/languages1.png?size=400x400&set=set2", title: "Languages", subtitle: "Translation Bots" },
      { img: "https://api.lorem.space/image/dashboard?w=400&h=400", title: "History", subtitle: "Archive Systems" },
      { img: "https://robohash.org/physics1.png?size=400x400&set=set3", title: "Physics", subtitle: "Quantum Machines" },
      { img: "https://api.lorem.space/image/crm?w=400&h=400", title: "Chemistry", subtitle: "Lab Automation" },
      { img: "https://robohash.org/geometry1.png?size=400x400", title: "Geometry", subtitle: "Precision Bots" },
      { img: "https://api.lorem.space/image/messenger?w=400&h=400", title: "Music", subtitle: "Audio Synthesis" },
      { img: "https://robohash.org/astronomy1.png?size=400x400&set=set2", title: "Astronomy", subtitle: "Space Probes" },
      { img: "https://api.lorem.space/image/finance?w=400&h=400", title: "Finance", subtitle: "Trading Algorithms" },
      { img: "https://robohash.org/technology1.png?size=400x400&set=set3", title: "Technology", subtitle: "Future Systems" },
      { img: "https://api.lorem.space/image/calendar?w=400&h=400", title: "Health", subtitle: "Medical AI" },
      { img: "https://robohash.org/sports1.png?size=400x400", title: "Sports", subtitle: "Athletic Droids" },
      { img: "https://api.lorem.space/image/game?w=400&h=400", title: "Art", subtitle: "Creative Machines" },
      { img: "https://robohash.org/design1.png?size=400x400&set=set2", title: "Design", subtitle: "Design Bots" },
      { img: "https://api.lorem.space/image/movie?w=400&h=400", title: "Business", subtitle: "Corporate AI" },
      { img: "https://robohash.org/psychology1.png?size=400x400&set=set3", title: "Psychology", subtitle: "Mind Readers" },
      { img: "https://api.lorem.space/image/face?w=400&h=400", title: "Social", subtitle: "Social Networks" },
      { img: "https://robohash.org/cooking1.png?size=400x400", title: "Cooking", subtitle: "Chef Robots" },
      { img: "https://api.lorem.space/image/album?w=400&h=400", title: "Travel", subtitle: "Explorer Bots" },
    ]
  },
  {
    name: "Neon & Cyberpunk",
    source: "Pixabay Neon + Custom",
    cards: [
      { img: "https://cdn.pixabay.com/photo/2017/01/18/16/46/hong-kong-1990268_640.jpg", title: "Mathematics", subtitle: "Digital Matrix" },
      { img: "https://cdn.pixabay.com/photo/2018/05/18/15/30/web-3411373_640.jpg", title: "Programming", subtitle: "Cyber Code" },
      { img: "https://cdn.pixabay.com/photo/2016/10/26/19/00/domain-names-1772242_640.jpg", title: "Languages", subtitle: "Data Streams" },
      { img: "https://cdn.pixabay.com/photo/2017/08/30/01/05/milky-way-2695569_640.jpg", title: "History", subtitle: "Time Circuits" },
      { img: "https://cdn.pixabay.com/photo/2018/05/08/08/44/artificial-intelligence-3382507_640.jpg", title: "Physics", subtitle: "Quantum Grid" },
      { img: "https://cdn.pixabay.com/photo/2016/11/30/12/16/chart-1873765_640.jpg", title: "Chemistry", subtitle: "Neon Elements" },
      { img: "https://cdn.pixabay.com/photo/2016/10/11/21/43/geometric-1732847_640.jpg", title: "Geometry", subtitle: "Cyber Shapes" },
      { img: "https://cdn.pixabay.com/photo/2016/11/29/13/14/attractive-1869761_640.jpg", title: "Music", subtitle: "Synthwave" },
      { img: "https://cdn.pixabay.com/photo/2011/12/14/12/17/galaxy-11098_640.jpg", title: "Astronomy", subtitle: "Digital Cosmos" },
      { img: "https://cdn.pixabay.com/photo/2017/03/25/17/55/color-2174045_640.png", title: "Finance", subtitle: "Crypto Markets" },
      { img: "https://cdn.pixabay.com/photo/2016/11/29/05/45/astronomy-1867616_640.jpg", title: "Technology", subtitle: "Neural Networks" },
      { img: "https://cdn.pixabay.com/photo/2016/11/21/16/05/black-and-white-1846560_640.jpg", title: "Health", subtitle: "Bio Metrics" },
      { img: "https://cdn.pixabay.com/photo/2016/11/29/13/39/beach-1869790_640.jpg", title: "Sports", subtitle: "Cyber Athletics" },
      { img: "https://cdn.pixabay.com/photo/2017/06/07/15/56/healing-stones-2380234_640.jpg", title: "Art", subtitle: "Digital Dreams" },
      { img: "https://cdn.pixabay.com/photo/2016/09/10/17/18/book-1659717_640.jpg", title: "Design", subtitle: "Neon Aesthetics" },
      { img: "https://cdn.pixabay.com/photo/2016/11/29/06/15/plans-1867745_640.jpg", title: "Business", subtitle: "Corporate Cyber" },
      { img: "https://cdn.pixabay.com/photo/2016/11/23/15/48/audience-1853662_640.jpg", title: "Psychology", subtitle: "Mind Hacking" },
      { img: "https://cdn.pixabay.com/photo/2017/06/20/22/14/man-2425121_640.jpg", title: "Social", subtitle: "Virtual Reality" },
      { img: "https://cdn.pixabay.com/photo/2016/11/29/04/19/beach-1867285_640.jpg", title: "Cooking", subtitle: "Molecular Gastro" },
      { img: "https://cdn.pixabay.com/photo/2011/12/14/12/21/orion-nebula-11107_640.jpg", title: "Travel", subtitle: "Space Tourism" },
    ]
  },
  {
    name: "3D Showcase & Pedestals",
    source: "Unsplash 3D Collection",
    cards: [
      { img: "https://source.unsplash.com/400x400/?3d,showcase,pedestal,abstract", title: "Mathematics", subtitle: "Golden Frameworks" },
      { img: "https://source.unsplash.com/400x400/?3d,render,minimal,platform", title: "Programming", subtitle: "Code Pedestals" },
      { img: "https://source.unsplash.com/400x400/?3d,display,modern,showcase", title: "Languages", subtitle: "Display Platforms" },
      { img: "https://source.unsplash.com/400x400/?3d,podium,minimal,design", title: "History", subtitle: "Museum Showcases" },
      { img: "https://source.unsplash.com/400x400/?3d,abstract,geometric,stage", title: "Physics", subtitle: "Laboratory Stages" },
      { img: "https://source.unsplash.com/400x400/?3d,cylinder,pedestal,modern", title: "Chemistry", subtitle: "Molecular Displays" },
      { img: "https://source.unsplash.com/400x400/?3d,geometric,minimal,form", title: "Geometry", subtitle: "Perfect Forms" },
      { img: "https://source.unsplash.com/400x400/?3d,stage,concert,platform", title: "Music", subtitle: "Concert Stages" },
      { img: "https://source.unsplash.com/400x400/?3d,cosmic,space,pedestal", title: "Astronomy", subtitle: "Cosmic Pedestals" },
      { img: "https://source.unsplash.com/400x400/?3d,premium,luxury,showcase", title: "Finance", subtitle: "Premium Showcases" },
      { img: "https://source.unsplash.com/400x400/?3d,tech,innovation,display", title: "Technology", subtitle: "Innovation Pods" },
      { img: "https://source.unsplash.com/400x400/?3d,wellness,health,platform", title: "Health", subtitle: "Wellness Platforms" },
      { img: "https://source.unsplash.com/400x400/?3d,victory,sports,podium", title: "Sports", subtitle: "Victory Podiums" },
      { img: "https://source.unsplash.com/400x400/?3d,gallery,art,display", title: "Art", subtitle: "Gallery Displays" },
      { img: "https://source.unsplash.com/400x400/?3d,studio,design,setup", title: "Design", subtitle: "Studio Setups" },
      { img: "https://source.unsplash.com/400x400/?3d,business,executive,stage", title: "Business", subtitle: "Executive Stages" },
      { img: "https://source.unsplash.com/400x400/?3d,mind,psychology,space", title: "Psychology", subtitle: "Mind Spaces" },
      { img: "https://source.unsplash.com/400x400/?3d,social,connection,hub", title: "Social", subtitle: "Connection Hubs" },
      { img: "https://source.unsplash.com/400x400/?3d,cooking,chef,pedestal", title: "Cooking", subtitle: "Chef Pedestals" },
      { img: "https://source.unsplash.com/400x400/?3d,travel,journey,showcase", title: "Travel", subtitle: "Journey Showcases" },
    ]
  }
];

// Constants for grid calculations
const CARD_SIZE = 200; // Container size
const ICON_SIZE = 180; // Actual icon size (from CSS --icon-size)
const CARD_GAP = Math.round((4/15) * ICON_SIZE); // 4/15 of icon width = 48px
const GRID_PADDING = 64; // 4rem in pixels
const CELL_WIDTH = CARD_SIZE + CARD_GAP;
const CELL_HEIGHT = CARD_SIZE + CARD_GAP;

// Seeded random number generator for consistent positioning
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default function InfiniteCanvas() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [currentCollection, setCurrentCollection] = useState(0);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [hasDragged, setHasDragged] = useState(false);

  // Get current card templates
  const cardTemplates = imageCollections[currentCollection].cards;

  // Generate a card for a specific grid position
  const generateCardForPosition = useCallback((row: number, col: number) => {
    const seed = row * 1000 + col; // Unique seed for each position
    const templateIndex = Math.floor(seededRandom(seed) * cardTemplates.length);
    const template = cardTemplates[templateIndex];
    
    return {
      id: `${row}-${col}`,
      img: template.img,
      title: template.title,
      subtitle: template.subtitle,
      x: col * CELL_WIDTH + GRID_PADDING,
      y: row * CELL_HEIGHT + GRID_PADDING,
    };
  }, [cardTemplates]);

  // Calculate visible cards based on current offset
  const visibleCards = useMemo(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate the bounds of what's currently visible
    const leftBound = -offset.x - CARD_SIZE;
    const rightBound = -offset.x + viewportWidth + CARD_SIZE;
    const topBound = -offset.y - CARD_SIZE;
    const bottomBound = -offset.y + viewportHeight + CARD_SIZE;
    
    // Calculate grid positions that are visible
    const startCol = Math.floor(leftBound / CELL_WIDTH);
    const endCol = Math.ceil(rightBound / CELL_WIDTH);
    const startRow = Math.floor(topBound / CELL_HEIGHT);
    const endRow = Math.ceil(bottomBound / CELL_HEIGHT);
    
    const cards = [];
    
    // Generate cards for visible grid positions
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        cards.push(generateCardForPosition(row, col));
      }
    }
    
    return cards;
  }, [offset, generateCardForPosition]);

  function onMouseDown(e: React.MouseEvent) {
    setDragging(true);
    setHasDragged(false);
    setStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }
  
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    setHasDragged(true);
    setOffset({ x: e.clientX - start.x, y: e.clientY - start.y });
  }
  
  function onMouseUp() {
    setDragging(false);
    // Reset hasDragged after a short delay to allow click detection
    setTimeout(() => setHasDragged(false), 100);
  }

  // Makeover function - cycles through collections
  function handleMakeover() {
    setCurrentCollection((prev) => (prev + 1) % imageCollections.length);
  }

  // Handle card click to open detail view
  function handleCardClick(card: any) {
    if (dragging || hasDragged) return; // Don't open detail if we're dragging
    
    // Create a card object with the clicked card's data
    const clickedCard = {
      id: card.id,
      img: card.img,
      title: card.title,
      subtitle: card.subtitle,
      category: card.title,
    };
    
    setSelectedCard(clickedCard);
  }

  // Get related cards for the detail view (same category/collection)
  function getRelatedCards(clickedCard: any) {
    // Create array with clicked card first, then add 9 more from collection
    const relatedCards = [];
    
    // Add the clicked card first (this will be centered)
    relatedCards.push({
      id: clickedCard.id,
      img: clickedCard.img,
      title: clickedCard.title,
      subtitle: clickedCard.subtitle,
      category: clickedCard.category || clickedCard.title,
    });
    
    // Add 9 more cards from the current collection (excluding the clicked one)
    const otherCards = cardTemplates
      .filter(template => template.title !== clickedCard.title)
      .slice(0, 9)
      .map((template, index) => ({
        id: `related-${index}`,
        img: template.img,
        title: template.title,
        subtitle: template.subtitle,
        category: template.title,
      }));
    
    relatedCards.push(...otherCards);
    return relatedCards;
  }

  // Handle navigation in detail view - now handled by CardDetail's 3D camera system
  function handleDetailNavigation(direction: 'left' | 'right') {
    // Navigation is now handled internally by CardDetail's 3D camera system
    // This function is kept for compatibility but does nothing
    console.log(`Navigation ${direction} - handled by 3D camera system`);
  }

  // Close detail view
  function closeDetailView() {
    setSelectedCard(null);
  }

  return (
    <>
      {/* Collection View - only render when no card is selected */}
      {!selectedCard && (
        <div
          className="InfiniteCanvas"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
        >
          {/* Makeover Button */}
          <button 
            className="makeover-button"
            onClick={handleMakeover}
            title={`Current: ${imageCollections[currentCollection].name} (${imageCollections[currentCollection].source})`}
          >
            🎨 Makeover
            <span className="collection-info">
              {imageCollections[currentCollection].name}
            </span>
          </button>

          {/* Background Video */}
          <video
            className="background-video"
            autoPlay
            loop
            muted
            playsInline
            onLoadStart={() => console.log('Video loading started')}
            onLoadedData={() => console.log('Video loaded successfully')}
            onError={(e) => console.error('Video error:', e)}
          >
            <source src="/assets/Cloud1.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Fallback Animated Cloud Background - only shows if video fails */}
          <div className="animated-clouds-background"></div>
          
          {/* Infinite card container */}
          <div
            className="InfiniteCardContainer"
            style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
          >
            {visibleCards.map((card) => (
              <div 
                key={card.id} 
                className="WidgetCard"
                style={{
                  position: 'absolute',
                  left: card.x,
                  top: card.y,
                }}
                onClick={() => handleCardClick(card)}
              >
                <div 
                  className="widget-background"
                  style={{ backgroundImage: `url(${card.img})` }}
                />
                <div className="widget-overlay" />
                <div className="widget-content">
                  <h3 className="widget-title">{card.title}</h3>
                  <p className="widget-subtitle">{card.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Globe/Detail View - only render when a card is selected */}
      {selectedCard && (
        <CardDetail
          card={selectedCard}
          onClose={closeDetailView}
          onNavigate={handleDetailNavigation}
          relatedCards={getRelatedCards(selectedCard)}
        />
      )}
    </>
  );
} 