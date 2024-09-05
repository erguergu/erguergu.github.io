

function createCubeSphere() {
	// Parameters for the geometry 
	const width = 1; const height = 1; const depth = 1; const widthSegments = 10; 
	// Number of segments along the width 
	const heightSegments = 10; 
	// Number of segments along the height 
	const depthSegments = 10; 
	// Number of segments along the depth 
	// Desired radius of the sphere 
	const radius = 1; 
	// Create BoxGeometry 
	const geometry = new THREE.BoxGeometry(width, height, depth, widthSegments, heightSegments, depthSegments); 
	// Access the vertices through the geometry's position attribute 
	const positionAttribute = geometry.attributes.position; 
	// Modify vertices to make them equidistant from the center 
	for (let i = 0; i < positionAttribute.count; i++) { 
	// Get vertex position 
	const x = positionAttribute.getX(i); const y = positionAttribute.getY(i); const z = positionAttribute.getZ(i); 
	// Calculate distance from the center 
	const length = Math.sqrt(x * x + y * y + z * z); 
	// Normalize and scale to the desired radius 
	const newX = (x / length) * radius; 
	const newY = (y / length) * radius; 
	const newZ = (z / length) * radius; 
	// Update vertex position 
	positionAttribute.setXYZ(i, newX, newY, newZ); } 
	// Recompute normals for shading 
	geometry.computeVertexNormals(); 
	// Create an array of materials, one for each triangle face 
	const numTriangles = geometry.index.count / 3; 
	// Number of triangles 
	const materials = []; 
	for (let i = 0; i < numTriangles; i++) { 
		const color = new THREE.Color(Math.random(), Math.random(), Math.random()); 
		// Random color for each face 
		materials.push(new THREE.MeshStandardMaterial({ color: color })); 
	} 
	// Clear any existing groups 
	geometry.clearGroups(); 
	// Assign a material index to each triangle face 
	for (let i = 0; i < numTriangles; i++) { 
		geometry.addGroup(i * 3, 3, i); 
		// Each group represents one triangle, starting index `i * 3`, 3 vertices per face, and material index `i` 
	} 
	// Create a mesh with the geometry and materials 
	const sphereMesh = new THREE.Mesh(geometry, materials);
	
	return sphereMesh;
}
