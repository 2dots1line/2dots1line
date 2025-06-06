# Cloud Assets Generation

This document describes the automated pipeline for generating cloud noise textures used in the CloudScene component.

## Overview

The 2dots1line project uses procedurally generated Perlin-Worley noise textures for realistic volumetric cloud rendering. The noise generation pipeline is fully automated and produces a 128³ 3D texture in KTX2 format.

## Quick Start

To generate or regenerate the cloud noise texture:

```bash
npm run gen:noise
```

This command will:
1. Build the noise generator (if not already built)
2. Generate 128³ Perlin-Worley noise data
3. Convert to KTX2 format (or download fallback)
4. Copy to the assets directory

## Requirements

### Required
- **CMake** (for building the noise generator)
- **Node.js** (for running the automation script)

### Optional
- **toktx** (from KTX-Software) - for optimal KTX2 conversion
  - If not available, the script automatically downloads a compatible fallback texture

## Technical Details

### Generated Files

| File | Location | Description |
|------|----------|-------------|
| `noise-gen` | `TileableVolumeNoise/build/` | Compiled noise generator executable |
| `PerlinWorley_128.raw` | `TileableVolumeNoise/` | Raw 128³ volume data (R8 format) |
| `perlinWorley128.ktx2` | `TileableVolumeNoise/` | KTX2 compressed texture |
| `perlinWorley128.ktx2` | `3d-assets/textures/noise/` | Final texture for CloudScene |

### Noise Parameters

The generated Perlin-Worley noise uses the following parameters:
- **Dimensions**: 128 × 128 × 128 voxels
- **Format**: Single channel (R8) grayscale
- **Frequency**: Base frequency of 8.0 with 3 octaves
- **Technique**: Based on GPU Pro 7 Chapter II-4 implementation

### Usage in CloudScene

The generated texture can be loaded in React Three Fiber components:

```typescript
import { useLoader } from '@react-three/fiber';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';

const densityTex = useLoader(
  KTX2Loader,
  '/textures/noise/perlinWorley128.ktx2'
);
```

## Automation Pipeline

The `scripts/gen-noise.js` script implements a robust 4-step pipeline:

### Step A: Build Generator
- Checks if `noise-gen` executable exists
- If missing, configures and builds using CMake
- Uses cross-platform build configuration with OpenMP support

### Step B: Generate RAW Data
- Executes noise generator with Perlin-Worley parameters
- Outputs raw volume data (128³ × 1 byte = ~2MB)

### Step C: KTX2 Conversion
- **Primary path**: Uses `toktx` for optimal compression
- **Fallback path**: Downloads pre-compressed texture if toktx unavailable
- Maintains R8 format compatibility

### Step D: Asset Deployment
- Creates assets directory structure if needed
- Copies final KTX2 file to `3d-assets/textures/noise/`
- Provides verification and file statistics

## Troubleshooting

### Build Issues
- **CMake not found**: Install CMake from https://cmake.org/
- **Compilation errors**: Ensure C++11 compatible compiler is available
- **OpenMP warnings**: Optional; affects generation speed but not output

### Runtime Issues
- **Permission errors**: Ensure write access to project directories
- **Network errors**: Check internet connection for fallback download
- **File size issues**: 128³ texture requires ~2MB disk space

## Customization

To modify noise parameters, edit `TileableVolumeNoise/main_cli.cpp`:

```cpp
// Adjust these values in generatePerlinWorleyNoise()
const int octaveCount = 3;        // Number of noise octaves
const float frequency = 8.0f;     // Base frequency
const float cellCount = 4;        // Worley cell count
```

After modifications, delete `TileableVolumeNoise/build/noise-gen` and run `npm run gen:noise` to rebuild.

## References

- [TileableVolumeNoise](https://github.com/sebh/TileableVolumeNoise) - Original noise generation library
- [GPU Pro 7](http://www.crcpress.com/product/isbn/9781498742535) - Chapter II-4: Physically Based Sky, Atmosphere and Cloud Rendering
- [KTX2 Format](https://www.khronos.org/ktx/) - Khronos texture format specification 