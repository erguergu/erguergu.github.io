class Planet {
    // need to figure this out.... 
    constructor({
        name = ''
        , radius = 10
        , pivot = undefined
        , distance = 0
        , material = new THREE.MeshLambertMaterial({color: 0x0044FF})
        , xRotate = 0
        , yRotate = -.1
        , zRotate = 0
        , speed = 1
        , initialRevolveAngle = 0
        , showOrbit = true
    } = {
        name: ''
        , radius: ''
        , pivot: ''
        , distance: ''
        , material: ''
        , xRotate: ''
        , yRotate: ''
        , zRotate: ''
        , speed: ''
        , initialRevolveAngle: ''
        , showOrbit: ''
    }) {
        this.name = name;
        this.radius = radius;
        this.pivot = pivot;
        this.distance = distance;
        this.material = material;

        const geometry = new THREE.SphereGeometry( this.radius, 20, 20 );
        this.mesh = new THREE.Mesh( geometry, this.material );

        this.xRotate = xRotate;
        this.yRotate = yRotate;
        this.zRotate = zRotate;

        this.speed = speed;
        this.initialRevolveAngle = initialRevolveAngle;
        this.showOrbit = showOrbit;

        this.satellites = [];

        if (this.pivot) {
            this.mesh.position.x = this.pivot.mesh.position.x + this.distance;
            this.pivot.satellites.push(this);
            this.revolve(this.initialRevolveAngle);
        }

        if (this.showOrbit) {
            this.orbitMesh = this.createCircle();
        }
    }

    createCircle = () => {
        const material = new THREE.LineBasicMaterial({
            color: 0xFFFFFF,
            opacity: .2,
            transparent: true
        });
        
        const points = [];

        const centerX = 0;
        const centerZ = 0;
        const radius = this.distance;
        for(let degree = 0; degree < 360; degree += 4 ) {
            const radians = degree * Math.PI / 180;
            const x = centerX + radius * Math.cos(radians);
            const z = centerZ + radius * Math.sin(radians);
            points.push( new THREE.Vector3( x, 0, z ) );
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints( points );
        
        const line = new THREE.LineLoop( geometry, material );
        
        return line;
    }

    tick = () => {
        this.rotate(this.xRotate, this.yRotate, this.zRotate);

        this.revolve(.02 * this.speed);
    }

    rotate = (degreeX=0, degreeY=0, degreeZ=0) => {
        this.mesh.rotateX(THREE.Math.degToRad(degreeX));
        this.mesh.rotateY(THREE.Math.degToRad(degreeY));
        this.mesh.rotateZ(THREE.Math.degToRad(degreeZ));
     }

     revolve = (degrees=1) => {
        if (this.pivot) {

            const point = this.mesh.position;
            const center = this.pivot.mesh.position;

            //const degrees = .1 * this.speed;
            const angle = degrees * (Math.PI/180); // Convert to radians
            const rotatedX = Math.cos(angle) * (point.x - center.x) - Math.sin(angle) * (point.z-center.z) + center.x;
            const rotatedZ = Math.sin(angle) * (point.x - center.x) + Math.cos(angle) * (point.z - center.z) + center.z;

            const deltaX = rotatedX - point.x;
            const deltaZ = rotatedZ - point.z;

            point.x = rotatedX;
            point.z = rotatedZ;

            // Finally finally shift our object's satellites
            for (const satellite of this.satellites) {
                satellite.mesh.position.x += deltaX;
                satellite.mesh.position.z += deltaZ;
                if (satellite.showOrbit) {
                    satellite.orbitMesh.position.x = rotatedX;
                    satellite.orbitMesh.position.z = rotatedZ;
                }
            }
        }
     }
}

export { Planet }