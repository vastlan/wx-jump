// src/block/cylinder.js
import blockConf from '../../confs/block-conf'

export default class Cylinder {
  constructor(x, y, z, name, width, options = {}) {
    this.instance = new THREE.Group()
    this.instance.name = 'block'
    this.instance.position.set(x, y, z) 
    
    this.name = name
    this.width = width
    this.height = blockConf.height
    this.x = x
    this.y = y
    this.z = z

    this.isNeat = options.isNeat !== undefined ? options.isNeat : Math.random() < 0.33;

    let segments = 32;
    if (options.allowShapes && Math.random() < 0.4) {
        segments = Math.random() > 0.5 ? 3 : 4;
    }

    let radius = width / 2;
    if (segments === 3) radius = (width / 2) * 1.3; 
    if (segments === 4) radius = (width / 2) * 1.2; 

    const geometry = new THREE.CylinderGeometry(radius, radius, this.height, segments, 3);
    
    if (segments === 4) geometry.rotateY(Math.PI / 4);
    if (segments === 3) geometry.rotateY(Math.PI / 6); 

    // ✨ 规整模式下跳过扭曲坍塌
    if (!this.isNeat) {
        if (geometry.vertices) {
            geometry.vertices.forEach(v => {
                v.x += (Math.random() - 0.5) * 1.5;
                v.y += (Math.random() - 0.5) * 0.4;
                v.z += (Math.random() - 0.5) * 1.5;
            });
            geometry.computeVertexNormals();
        } else if (geometry.attributes && geometry.attributes.position) {
            const pos = geometry.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 1.5);
                pos.setY(i, pos.getY(i) + (Math.random() - 0.5) * 0.4); 
                pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * 1.5);
            }
            geometry.computeVertexNormals();
        }
    }

    let gridSegments = 1;
    if (options.isMixed || Math.random() < 0.3) {
        gridSegments = Math.random() > 0.5 ? 2 : 3;
    }

    this.material = this.createSketchMats({ gridSegments, segments });
    const mesh = new THREE.Mesh(geometry, this.material)
    mesh.position.set(0, 0, 0)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.instance.add(mesh)
  }

  drawSketchLine(ctx, x1, y1, x2, y2, thickness) {
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      const jitter = this.isNeat ? 1 : 6;
      const cpJitter = this.isNeat ? 2 : 15;
      const drawCount = this.isNeat ? 2 : 3;

      for (let i = 0; i < drawCount; i++) {
          ctx.beginPath();
          ctx.moveTo(x1 + (Math.random() - 0.5) * jitter, y1 + (Math.random() - 0.5) * jitter);
          const cpX = (x1 + x2) / 2 + (Math.random() - 0.5) * cpJitter;
          const cpY = (y1 + y2) / 2 + (Math.random() - 0.5) * cpJitter;
          ctx.quadraticCurveTo(cpX, cpY, x2 + (Math.random() - 0.5) * jitter, y2 + (Math.random() - 0.5) * jitter);
          ctx.stroke();
      }
  }

  createSketchMats(opts) {
    const createSideTex = (text) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024; canvas.height = 256; 
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, 1024, 256);
      
      if (!this.isNeat) {
          ctx.fillStyle = '#1A1A1A';
          for(let i=0; i<15; i++) {
              ctx.beginPath(); ctx.arc(Math.random()*1024, Math.random()*256, Math.random()*2, 0, Math.PI*2); ctx.fill();
          }
      }

      ctx.strokeStyle = '#1A1A1A';
      const b = 6; const os = this.isNeat ? 5 : 30;
      this.drawSketchLine(ctx, -os, b, 1024+os, b, 5);
      this.drawSketchLine(ctx, -os, 256-b, 1024+os, 256-b, 5);

      if (opts.gridSegments && opts.gridSegments > 1) {
        const isCircle = opts.segments > 4;
        const hStep = 256 / opts.gridSegments;
        const wStep = 1024 / (opts.gridSegments * 4);
        
        for (let i = 1; i < opts.gridSegments; i++) {
            this.drawSketchLine(ctx, -os, i * hStep, 1024+os, i * hStep, 3);
        }
        if (!isCircle) {
            for (let i = 1; i < opts.gridSegments * 4; i++) {
                this.drawSketchLine(ctx, i * wStep, -os, i * wStep, 256+os, 3);
            }
        }
      }

      if (text) {
        ctx.fillStyle = '#1A1A1A';
        ctx.font = '900 80px "-apple-system", "PingFang SC", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const tJitter = this.isNeat ? 0 : 20;
        const rot = this.isNeat ? 0 : (Math.random() - 0.5) * 0.2;

        for(let i=0; i<4; i++) {
            ctx.save();
            ctx.translate(128 + i * 256 + (Math.random()-0.5)*tJitter, 128 + (Math.random()-0.5)*tJitter);
            ctx.rotate(rot);
            ctx.fillText(text, 0, 0);
            ctx.restore();
        }
      }
      
      const tex = new THREE.CanvasTexture(canvas);
      tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
      return tex;
    };
    
    const createTopTex = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, 256, 256);
        
        if (!this.isNeat) {
            ctx.fillStyle = '#1A1A1A';
            for(let i=0; i<5; i++) {
                ctx.beginPath(); ctx.arc(Math.random()*256, Math.random()*256, Math.random()*2, 0, Math.PI*2); ctx.fill();
            }
        }

        ctx.strokeStyle = '#1A1A1A';
        const b = 6; const os = this.isNeat ? 5 : 20;
        
        if (opts.gridSegments && opts.gridSegments > 1) {
            const step = 256 / opts.gridSegments;
            for (let i = 1; i < opts.gridSegments; i++) {
                this.drawSketchLine(ctx, i * step, -os, i * step, 256+os, 3);
                this.drawSketchLine(ctx, -os, i * step, 256+os, i * step, 3);
            }
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
        return tex;
    }

    const sideMat = new THREE.MeshBasicMaterial({ map: createSideTex(opts.text), transparent: true });
    const topMat = new THREE.MeshBasicMaterial({ map: createTopTex(), transparent: true });
    return [sideMat, topMat, topMat];
  }

  setSketchText(text) {
      const mesh = this.instance.children[0];
      if (mesh && mesh.material) {
          if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose());
          else mesh.material.dispose();
          mesh.material = this.createSketchMats({ text, gridSegments: 1, segments: mesh.geometry.parameters.radialSegments || 32 });
      }
  }
}