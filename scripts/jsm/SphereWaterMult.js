import {
	Color,
	FrontSide,
	Matrix4,
	Mesh,
	PerspectiveCamera,
	Plane,
	ShaderMaterial,
	UniformsLib,
	UniformsUtils,
	Vector3,
	Vector4,
	WebGLRenderTarget
} from 'three';

/**
 * Work based on :
 * https://github.com/Slayvin: Flat mirror for three.js
 * https://home.adelphi.edu/~stemkoski/ : An implementation of water shader based on the flat mirror
 * http://29a.ch/ && http://29a.ch/slides/2012/webglwater/ : Water shader explanations in WebGL
 */

class Water extends Mesh {

	constructor( geometry, options = {} ) {

		super( geometry );
        console.log(`sphere cube geo:`, geometry);

		this.isWater = true;

		const scope = this;

		const textureWidth = options.textureWidth !== undefined ? options.textureWidth : 512;
		const textureHeight = options.textureHeight !== undefined ? options.textureHeight : 512;

		const clipBias = options.clipBias !== undefined ? options.clipBias : 0.0;
		const alpha = options.alpha !== undefined ? options.alpha : 1.0;
		const time = options.time !== undefined ? options.time : 0.0;
		const normalSampler = options.waterNormals !== undefined ? options.waterNormals : null;
		const sunDirection = options.sunDirection !== undefined ? options.sunDirection : new Vector3( 0.70707, 0.70707, 0.0 );
		const sunColor = new Color( options.sunColor !== undefined ? options.sunColor : 0xffffff );
		const waterColor = new Color( options.waterColor !== undefined ? options.waterColor : 0x7F7F7F );
		const eye = options.eye !== undefined ? options.eye : new Vector3( 0, 0, 0 );
		const distortionScale = options.distortionScale !== undefined ? options.distortionScale : 20.0;
		const side = options.side !== undefined ? options.side : FrontSide;
		const fog = options.fog !== undefined ? options.fog : false;

        const onBeforeRenders = [];

		//
        
        const numTriangles = geometry.index.count / 3; 
        // Number of triangles 
        const materials = []; 
        console.log(`There are ${numTriangles} triangles. We have to create a material and camera for each.`);
        for (let i = 0; i < numTriangles; i++) { 

            const mirrorPlane = new Plane();
            const normal = getNormal(geometry, i); // actually you need to do this at render because the geometry could change.
            const mirrorWorldPosition = new Vector3(); 
            const cameraWorldPosition = new Vector3();
            const rotationMatrix = new Matrix4();
            const lookAtPosition = new Vector3( 0, 0, - 1 ); // this might be something we can do once, but let's not risk it, just do for every group
            const clipPlane = new Vector4();

            const view = new Vector3();
            const target = new Vector3();
            const q = new Vector4();

            const textureMatrix = new Matrix4();

            const mirrorCamera = new PerspectiveCamera();

            const renderTarget = new WebGLRenderTarget( textureWidth, textureHeight );

            const mirrorShader = {

                name: 'MirrorShader',

                uniforms: UniformsUtils.merge( [
                    UniformsLib[ 'fog' ],
                    UniformsLib[ 'lights' ],
                    {
                        'normalSampler': { value: null },
                        'mirrorSampler': { value: null },
                        'alpha': { value: 1.0 },
                        'time': { value: 0.0 },
                        'size': { value: 1000.0 },
                        'distortionScale': { value: 20.0 },
                        'textureMatrix': { value: new Matrix4() },
                        'sunColor': { value: new Color( 0x7F7F7F ) },
                        'sunDirection': { value: new Vector3( 0.70707, 0.70707, 0 ) },
                        'eye': { value: new Vector3() },
                        'waterColor': { value: new Color( 0x555555 ) }
                    }
                ] ),

                vertexShader: /* glsl */`
                    uniform mat4 textureMatrix;
                    uniform float time;

                    varying vec4 mirrorCoord;
                    varying vec4 worldPosition;
                    varying vec2 vUv;

                    #include <common>
                    #include <fog_pars_vertex>
                    #include <shadowmap_pars_vertex>
                    #include <logdepthbuf_pars_vertex>

                    void main() {
                        vUv = uv;
                        mirrorCoord = modelMatrix * vec4( position, 1.0 );
                        //worldPosition = mirrorCoord.xyzw;
                        mirrorCoord = textureMatrix * mirrorCoord;
                        vec4 mvPosition =  modelViewMatrix * vec4( position, 1.0 );
                        gl_Position = projectionMatrix * mvPosition;

                        #include <beginnormal_vertex>
                        #include <defaultnormal_vertex>
                        #include <logdepthbuf_vertex>
                        #include <fog_vertex>
                        #include <shadowmap_vertex>
                    }`,

                fragmentShader: /* glsl */`
                    uniform sampler2D mirrorSampler;
                    uniform float alpha;
                    uniform float time;
                    uniform float size;
                    uniform float distortionScale;
                    uniform sampler2D normalSampler;
                    uniform vec3 sunColor;
                    uniform vec3 sunDirection;
                    uniform vec3 eye;
                    uniform vec3 waterColor;

                    varying vec4 mirrorCoord;
                    varying vec4 worldPosition;
                    varying vec2 vUv;

                    vec4 getNoise( vec2 uv ) {
                        vec2 uv0 = ( uv / 103.0 ) + vec2(time / 17.0, time / 29.0);
                        vec2 uv1 = uv / 107.0-vec2( time / -19.0, time / 31.0 );
                        vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( time / 101.0, time / 97.0 );
                        vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( time / 109.0, time / -113.0 );
                        vec4 noise = texture2D( normalSampler, uv0 ) +
                            texture2D( normalSampler, uv1 ) +
                            texture2D( normalSampler, uv2 ) +
                            texture2D( normalSampler, uv3 );
                        return noise * 0.5 - 1.0;
                    }

                    void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor ) {
                        vec3 reflection = normalize( reflect( -sunDirection, surfaceNormal ) );
                        float direction = max( 0.0, dot( eyeDirection, reflection ) );
                        specularColor += pow( direction, shiny ) * sunColor * spec;
                        diffuseColor += max( dot( sunDirection, surfaceNormal ), 0.0 ) * sunColor * diffuse;
                    }

                    #include <common>
                    #include <packing>
                    #include <bsdfs>
                    #include <fog_pars_fragment>
                    #include <logdepthbuf_pars_fragment>
                    #include <lights_pars_begin>
                    #include <shadowmap_pars_fragment>
                    #include <shadowmask_pars_fragment>

                    void main() {

                        #include <logdepthbuf_fragment>
                        //vec4 noise = getNoise( worldPosition.xz * size );
                        vec4 noise = getNoise( vUv * size );
                        vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );

                        vec3 diffuseLight = vec3(0.0);
                        vec3 specularLight = vec3(0.0);

                        vec3 worldToEye = eye-worldPosition.xyz;
                        vec3 eyeDirection = normalize( worldToEye );
                        sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );

                        float distance = length(worldToEye);

                        vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / distance ) * distortionScale;
                        vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.w + distortion ) );

                        float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );
                        float rf0 = 0.3;
                        float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );
                        vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;
                        vec3 albedo = mix( ( sunColor * diffuseLight * 0.3 + scatter ) * getShadowMask(), ( vec3( 0.1 ) + reflectionSample * 0.9 + reflectionSample * specularLight ), reflectance);
                        vec3 outgoingLight = albedo;
                        gl_FragColor = vec4( outgoingLight, alpha );

                        #include <tonemapping_fragment>
                        #include <colorspace_fragment>
                        #include <fog_fragment>	
                    }`

            };

            

            const material = new ShaderMaterial( {
                name: mirrorShader.name,
                uniforms: UniformsUtils.clone( mirrorShader.uniforms ),
                vertexShader: mirrorShader.vertexShader,
                fragmentShader: mirrorShader.fragmentShader,
                lights: true,
                side: side,
                fog: fog
            } );

            material.uniforms[ 'mirrorSampler' ].value = renderTarget.texture;
            material.uniforms[ 'textureMatrix' ].value = textureMatrix;
            material.uniforms[ 'alpha' ].value = alpha;
            material.uniforms[ 'time' ].value = time;
            material.uniforms[ 'normalSampler' ].value = normalSampler;
            material.uniforms[ 'sunColor' ].value = sunColor;
            material.uniforms[ 'waterColor' ].value = waterColor;
            material.uniforms[ 'sunDirection' ].value = sunDirection;
            material.uniforms[ 'distortionScale' ].value = distortionScale;

            material.uniforms[ 'eye' ].value = eye;
            materials.push( material ); 

            onBeforeRenders.push(function ( renderer, scene, camera ) {

                // I *think* getting the position of the triangle is better than getting the position of the object.
                // to do that we first get the average of the three vertexes for this triangle.
                const pos = geometry.getAttribute('position').array;
                            
                const posX = pos[i * 3]; 
                const posY = pos[i * 3 + 1]; 
                const posZ = pos[i * 3 + 2]; 
                const v1 = new Vector3(posX,posY,posZ);
                // positionAttribute.getX(index)
                const posCenter = new THREE.vector3().add(v1).add(v2).add(v3).divideScalar(3);

                // then we can convert that to world space with applyMatrix4
                mirrorWorldPosition = posCenter.clone().applyMatrix4(scope.matrixWorld)
                //mirrorWorldPosition.setFromMatrixPosition( scope.matrixWorld ); // i think this needs to be once per group

                cameraWorldPosition.setFromMatrixPosition( camera.matrixWorld ); // this might be something we can do only once
    
                rotationMatrix.extractRotation( scope.matrixWorld ); // just once I think
    
                // I think normal needs to be set to the normal of the given face/group
                //normal.set( 0, 0, 1 ); this should have been set correctly above
                normal.applyMatrix4( rotationMatrix );
    
                view.subVectors( mirrorWorldPosition, cameraWorldPosition ); // once per group, view needs to be array
    
                // Avoid rendering when mirror is facing away
    
                if ( view.dot( normal ) > 0 ) return; // once per group
    
                view.reflect( normal ).negate(); //once per group
                view.add( mirrorWorldPosition ); // once per group
    
                rotationMatrix.extractRotation( camera.matrixWorld ); // just once
    
                lookAtPosition.set( 0, 0, - 1 ); // just once
                lookAtPosition.applyMatrix4( rotationMatrix ); // just once
                lookAtPosition.add( cameraWorldPosition ); // just once
    
                target.subVectors( mirrorWorldPosition, lookAtPosition ); // once per group
                target.reflect( normal ).negate(); // once per group
                target.add( mirrorWorldPosition ); // once per group
    
                // all these are once per group
                mirrorCamera.position.copy( view );
                mirrorCamera.up.set( 0, 1, 0 );
                mirrorCamera.up.applyMatrix4( rotationMatrix );
                mirrorCamera.up.reflect( normal );
                mirrorCamera.lookAt( target );
    
                // once per group
                mirrorCamera.far = camera.far; // Used in WebGLBackground
    
                mirrorCamera.updateMatrixWorld(); // once per group
                mirrorCamera.projectionMatrix.copy( camera.projectionMatrix ); // once per group
    
                // no idea what this does but I think it's once per group
                textureMatrix.set(
                    0.5, 0.0, 0.0, 0.5,
                    0.0, 0.5, 0.0, 0.5,
                    0.0, 0.0, 0.5, 0.5,
                    0.0, 0.0, 0.0, 1.0
                );
                textureMatrix.multiply( mirrorCamera.projectionMatrix ); // once per group
                textureMatrix.multiply( mirrorCamera.matrixWorldInverse ); // once per group
    
                // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
                // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
                mirrorPlane.setFromNormalAndCoplanarPoint( normal, mirrorWorldPosition );
                mirrorPlane.applyMatrix4( mirrorCamera.matrixWorldInverse );
    
                clipPlane.set( mirrorPlane.normal.x, mirrorPlane.normal.y, mirrorPlane.normal.z, mirrorPlane.constant );
    
                const projectionMatrix = mirrorCamera.projectionMatrix;
    
                q.x = ( Math.sign( clipPlane.x ) + projectionMatrix.elements[ 8 ] ) / projectionMatrix.elements[ 0 ];
                q.y = ( Math.sign( clipPlane.y ) + projectionMatrix.elements[ 9 ] ) / projectionMatrix.elements[ 5 ];
                q.z = - 1.0;
                q.w = ( 1.0 + projectionMatrix.elements[ 10 ] ) / projectionMatrix.elements[ 14 ];
    
                // Calculate the scaled plane vector
                clipPlane.multiplyScalar( 2.0 / clipPlane.dot( q ) );
    
                // Replacing the third row of the projection matrix
                projectionMatrix.elements[ 2 ] = clipPlane.x;
                projectionMatrix.elements[ 6 ] = clipPlane.y;
                projectionMatrix.elements[ 10 ] = clipPlane.z + 1.0 - clipBias;
                projectionMatrix.elements[ 14 ] = clipPlane.w;
    
                eye.setFromMatrixPosition( camera.matrixWorld );
    
                // Render
    
                const currentRenderTarget = renderer.getRenderTarget();
    
                const currentXrEnabled = renderer.xr.enabled;
                const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
    
                scope.visible = false;
    
                renderer.xr.enabled = false; // Avoid camera modification and recursion
                renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows
    
                renderer.setRenderTarget( renderTarget );
    
                renderer.state.buffers.depth.setMask( true ); // make sure the depth buffer is writable so it can be properly cleared, see #18897
    
                if ( renderer.autoClear === false ) renderer.clear();
                renderer.render( scene, mirrorCamera );
    
                scope.visible = true;
    
                renderer.xr.enabled = currentXrEnabled;
                renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
    
                renderer.setRenderTarget( currentRenderTarget );
    
                // Restore viewport
    
                const viewport = camera.viewport;
    
                if ( viewport !== undefined ) {
    
                    renderer.state.viewport( viewport );
    
                }
    
            });
        } 

		scope.material = materials;

		scope.onBeforeRender = function ( renderer, scene, camera ) {

            for (let onBefore of onBeforeRenders) {
                //onBefore( renderer, scene, camera );
            }

        };

	}

}

function getNormal(geometry, vertexIndex) {
    const normals = geometry.attributes.normal.array; 
    // Float32Array of normals 
    // Specify the index of the vertex whose normal you want to retrieve 
    //const vertexIndex = 0; // For example, 0 is the first vertex 
    
    // Each vertex normal is represented by 3 consecutive floats in the array 
    const normalX = normals[vertexIndex * 3]; 
    const normalY = normals[vertexIndex * 3 + 1]; 
    const normalZ = normals[vertexIndex * 3 + 2]; 
    
    // Create a THREE.Vector3 to represent the normal 
    const normal = new Vector3(normalX, normalY, normalZ); 
    console.log(`normal ${vertexIndex}:`,normal);
    return normal;
}

export { Water };