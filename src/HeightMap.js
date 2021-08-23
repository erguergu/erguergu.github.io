


class HeightMapGenerator {

    constructor () {
        console.log(`HeightMap Generator`);
    }

    applyHeightToPlane = (geometry, heightData) => {

        // geometry is a PlaneGeometry


        // This is how you figure out how to place something above a specific point in the terrain I think...
        //camera.position.y = heightData[ terrainHalfWidth + terrainHalfDepth * terrainWidth ] * ( terrainMaxHeight - terrainMinHeight ) + 5;

        const vertices = geometry.attributes.position.array;

        for ( let i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {

            // j + 1 because it is the y component that we modify
            vertices[ j + 1 ] = heightData[ i ];

        }

        geometry.computeVertexNormals();
    }

    generateFlatHeightData = (width, depth) => {

        const size = width * depth;
        const data = new Float32Array( size );

        let p = 0;

        for ( let j = 0; j < depth; j ++ ) {

            for ( let i = 0; i < width; i ++ ) {

                const height = 0;

                data[ p ] = height;

                p ++;
            }
        }

        return data;
    }

    generateTextureHeightData = ( width, depth, minHeight, maxHeight, textureArray ) => {

        // Generates the height data (a sinus wave)

        const size = width * depth;
        const data = new Float32Array( size );

        const hRange = maxHeight - minHeight;
        const mult = hRange / 255.0;

        let p = 0;

        for ( let j = 0; j < textureArray.length; j++ ) {

            // 1 to 2
            // hrange is 1
            // value of 128 out of 255
            // 1 / 255 = x
            // return x * 128
            data[j] = (textureArray[j] * mult) + minHeight;
        }
        console.log(`width: ${width}, depth: ${depth}`);

        return data;

    }

    generateSampleWavyHeightData = ( width, depth, minHeight, maxHeight ) => {

        // Generates the height data (a sinus wave)

        const size = width * depth;
        const data = new Float32Array( size );

        const hRange = maxHeight - minHeight;
        const w2 = width / 2;
        const d2 = depth / 2;
        const phaseMult = 12;

        let p = 0;

        for ( let j = 0; j < depth; j ++ ) {

            for ( let i = 0; i < width; i ++ ) {

                const radius = Math.sqrt(
                    Math.pow( ( i - w2 ) / w2, 2.0 ) +
                        Math.pow( ( j - d2 ) / d2, 2.0 ) );

                const height = ( Math.sin( radius * phaseMult ) + 1 ) * 0.5 * hRange + minHeight;

                data[ p ] = height;

                p ++;

            }

        }

        return data;

    }

    createTerrainShape = (heightData, terrainWidth, terrainDepth, terrainMinHeight, terrainMaxHeight, terrainWidthExtents, terrainDepthExtents) => {
    
        // This parameter is not really used, since we are using PHY_FLOAT height data type and hence it is ignored
        const heightScale = 1;
    
        // Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
        const upAxis = 1;
    
        // hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
        const hdt = "PHY_FLOAT";
    
        // Set this to your needs (inverts the triangles)
        const flipQuadEdges = false;
    
        // Creates height data buffer in Ammo heap
        const ammoHeightData = Ammo._malloc( 4 * terrainWidth * terrainDepth );
    
        // Copy the javascript height data array to the Ammo one.
        let p = 0;
        let p2 = 0;
    
        for ( let j = 0; j < terrainDepth; j ++ ) {
    
            for ( let i = 0; i < terrainWidth; i ++ ) {
    
                // write 32-bit float data to memory
                Ammo.HEAPF32[ ammoHeightData + p2 >> 2 ] = heightData[ p ];
    
                p ++;
    
                // 4 bytes/float
                p2 += 4;
    
            }
    
        }
    
        // Creates the heightfield physics shape
        const heightFieldShape = new Ammo.btHeightfieldTerrainShape(
            terrainWidth,
            terrainDepth,
            ammoHeightData,
            heightScale,
            terrainMinHeight,
            terrainMaxHeight,
            upAxis,
            hdt,
            flipQuadEdges
        );
    
        // Set horizontal scale
        const scaleX = terrainWidthExtents / ( terrainWidth - 1 );
        const scaleZ = terrainDepthExtents / ( terrainDepth - 1 );
        heightFieldShape.setLocalScaling( new Ammo.btVector3( scaleX, 1, scaleZ ) );
    
        return heightFieldShape;
    
    }

}


export { HeightMapGenerator };