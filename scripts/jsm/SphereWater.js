import {
	Color,
	FrontSide,
	Matrix4,
	Mesh,
	PerspectiveCamera,
    CubeCamera,
	Plane,
	ShaderMaterial,
	UniformsLib,
	UniformsUtils,
	Vector3,
	Vector4,
	WebGLRenderTarget,
    WebGLCubeRenderTarget
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

		// This is from their examples, they use a cube camera for reflections on a sphere:
        // cubeRenderTarget = new THREE.WebGLCubeRenderTarget( 256 );
        // cubeRenderTarget.texture.type = THREE.HalfFloatType;
        // cubeCamera = new THREE.CubeCamera( 1, 1000, cubeRenderTarget );
        // material = new THREE.MeshStandardMaterial( {
        //     envMap: cubeRenderTarget.texture,
        //     roughness: 0.05,
        //     metalness: 1
        // } );

		const mirrorPlane = new Plane();
		const normal = new Vector3();
		const mirrorWorldPosition = new Vector3();
		const cameraWorldPosition = new Vector3();
		const rotationMatrix = new Matrix4();
		const lookAtPosition = new Vector3( 0, 0, - 1 );
		const clipPlane = new Vector4();

		const view = new Vector3();
		const target = new Vector3();
		const q = new Vector4();
		const textureMatrix = new Matrix4();
		const renderTarget = new WebGLCubeRenderTarget( textureWidth );
		const mirrorCamera = new CubeCamera( 1, 1000, renderTarget );


        const reflectiveMaterial = new ShaderMaterial({
            uniforms: {/*
                envMap: { value: cubeRenderTarget.texture }, // Use the texture from CubeCamera
                cameraPosition: { value: camera.position },
            */},
            vertexShader: `
                varying vec3 vReflect;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vec3 cameraToVertex = normalize(worldPosition.xyz - cameraPosition);
                    vReflect = reflect(cameraToVertex, normalize(normalMatrix * normal));
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform samplerCube envMap;
                varying vec3 vReflect;
                void main() {
                    vec4 envColor = textureCube(envMap, vReflect);
                    gl_FragColor = envColor; // Reflective color
                }
            `,
        });

		const mirrorShader = {

			name: 'MirrorShader',

			uniforms: {
                lightPosition: { value: new Vector3(1000, 1000, 1000) },
                ambientColor: { value: new Color(0.00, 0.00, 0.00) },
                diffuseColor: { value: new Color(1, 0, 0) },  // Red diffuse
                specularColor: { value: new Color(1, 1, 1) }, // White specular
                shininess: { value: 30.0 }
            },

			vertexShader: /* glsl */`
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
        //vNormal = normalize(normalMatrix * normal);
        vNormal = normalize(mat3(modelMatrix) * normal);
        vPosition = vec3(modelViewMatrix * vec4(position, 1.0));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`,

			fragmentShader: /* glsl */`
    uniform vec3 lightPosition;     // Position of the light source
    uniform vec3 ambientColor;      // Ambient light color
    uniform vec3 diffuseColor;      // Diffuse light color
    uniform vec3 specularColor;     // Specular light color
    uniform float shininess;        // Shininess factor for specular highlights
    
    varying vec3 vNormal;           // Interpolated normal vector in camera space
    varying vec3 vPosition;         // Interpolated fragment position in camera space

    void main() {
        // Normalize interpolated normal to ensure proper lighting calculations
        vec3 normal = normalize(vNormal);

        // Calculate light direction (from fragment to light source)
        vec3 lightDir = normalize(lightPosition - vPosition);

        // Calculate view direction (from fragment to camera)
        vec3 viewDir = normalize(cameraPosition - vPosition);

        // Ambient component remains constant across all surfaces
        vec3 ambient = ambientColor;

        // Diffuse component calculation (only if facing the light source)
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = diffuseColor * diff;

        // Specular component calculation (only if facing the light source)
        vec3 specular = vec3(0.0);
        if (diff > 0.0) {
            // Reflect the light direction around the normal
            vec3 reflectDir = reflect(-lightDir, normal);
            
            // Calculate specular factor based on view direction and reflection direction
            float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
            specular = specularColor * spec;
        }

        // Combine ambient, diffuse, and specular components for final color
        vec3 finalColor = ambient + diffuse + specular;
        gl_FragColor = vec4(finalColor, 1.0);
    }
`

		};
		const material = new ShaderMaterial({
            vertexShader: mirrorShader.vertexShader,
            fragmentShader: mirrorShader.fragmentShader,
            uniforms: mirrorShader.uniforms
        });

		scope.material = material;

		const scopeonBeforeRender = function ( renderer, scene, camera ) {

			mirrorWorldPosition.setFromMatrixPosition( scope.matrixWorld );
			cameraWorldPosition.setFromMatrixPosition( camera.matrixWorld );

			rotationMatrix.extractRotation( scope.matrixWorld );

			normal.set( 0, 0, 1 );
			normal.applyMatrix4( rotationMatrix );

			view.subVectors( mirrorWorldPosition, cameraWorldPosition );

			// Avoid rendering when mirror is facing away
			//if ( view.dot( normal ) > 0 ) return;

			view.reflect( normal ).negate();
			view.add( mirrorWorldPosition );

			rotationMatrix.extractRotation( camera.matrixWorld );

			lookAtPosition.set( 0, 0, - 1 );
			lookAtPosition.applyMatrix4( rotationMatrix );
			lookAtPosition.add( cameraWorldPosition );

			target.subVectors( mirrorWorldPosition, lookAtPosition );
			target.reflect( normal ).negate();
			target.add( mirrorWorldPosition );

			mirrorCamera.position.copy( view );
			mirrorCamera.up.set( 0, 1, 0 );
			mirrorCamera.up.applyMatrix4( rotationMatrix );
			mirrorCamera.up.reflect( normal );
			mirrorCamera.lookAt( target );

			mirrorCamera.far = camera.far; // Used in WebGLBackground

			mirrorCamera.updateMatrixWorld();
            console.log(`mirrorCamera`, mirrorCamera);
            for (let mirCam of mirrorCamera.children) {
			    mirCam.projectionMatrix.copy( camera.projectionMatrix );
            }

			// Update the texture matrix
			textureMatrix.set(
				0.5, 0.0, 0.0, 0.5,
				0.0, 0.5, 0.0, 0.5,
				0.0, 0.0, 0.5, 0.5,
				0.0, 0.0, 0.0, 1.0
			);
			textureMatrix.multiply( mirrorCamera.projectionMatrix );
			textureMatrix.multiply( mirrorCamera.matrixWorldInverse );

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

		};

	}

}

export { Water };
