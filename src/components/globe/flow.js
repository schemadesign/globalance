export class Flow {
	constructor(group, particleCount = 10000) {
		this.group = group;
		this.particleCount = particleCount;

		this.randomPointOnSphere = (radius) => {
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);
			const x = radius * Math.sin(phi) * Math.cos(theta);
			const y = radius * Math.sin(phi) * Math.sin(theta);
			const z = radius * Math.cos(phi);
			return new THREE.Vector3(x, y, z);
		};

		this.randomPoints = new Array(10).fill(0).map(() => this.randomPointOnSphere(1.025));

		// Add random points to the sphere
		let pointGeometry = new THREE.SphereGeometry(0.02, 32, 32);
		let pointMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
		let pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);

		this.randomPoints.forEach((point) => {
			let sphere = pointMesh.clone();
			sphere.position.copy(point);
			// Uncomment to add to group
			// this.group.add(sphere);
		});

		// Particles
		let particleGeometry = new THREE.SphereGeometry(0.005, 16, 16);
		let particleMaterial = new THREE.MeshBasicMaterial({ color: 0xf8dc5d });

		this.instancedParticles = new THREE.InstancedMesh(
			particleGeometry,
			particleMaterial,
			this.particleCount
		);
		this.group.add(this.instancedParticles);

		// Store target positions for each particle
		this.particleTargets = [];
		this.particlePositions = [];

		for (let i = 0; i < this.particleCount; i++) {
			const pos = this.randomPointOnSphere(1.025);
			this.particleTargets.push(pos.clone());
			// Start at random position inside sphere
			const start = this.randomPointOnSphere(Math.random() * 1.025);
			this.particlePositions.push(start.clone());
			const matrix = new THREE.Matrix4().setPosition(start);
			this.instancedParticles.setMatrixAt(i, matrix);
		}
		this.instancedParticles.instanceMatrix.needsUpdate = true;
	}

	animate(speed = 0.01) {
		for (let i = 0; i < this.particleCount; i++) {
			const pos = this.particlePositions[i];
			const target = this.particleTargets[i];
			// Move towards target
			pos.lerp(target, speed);
			// Optionally reset if close to target
			if (pos.distanceTo(target) < 0.001) {
				// Reset to a new random position inside sphere
				this.particlePositions[i] = this.randomPointOnSphere(Math.random() * 1.025);
			}
			const matrix = new THREE.Matrix4().setPosition(this.particlePositions[i]);
			this.instancedParticles.setMatrixAt(i, matrix);
		}
		this.instancedParticles.instanceMatrix.needsUpdate = true;
	}
}