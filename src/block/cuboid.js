// src/block/cuboid.js
import blockConf from '../../confs/block-conf'

export default class Cuboid {
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

    // ✨ 约 33% 概率生成规规矩矩的方块
    this.isNeat = options.isNeat !== undefined ? options.isNeat : Math.random() < 0.33;

    const geometry = new THREE.BoxGeometry(width, this.height, width, 2, 2, 2)
    
    // ✨ 只有在“不规整”状态下，才执行模型坍塌扭曲
    if (!this.isNeat) {
        if (geometry.vertices) {
            geometry.vertices.forEach(v => {
                v.x += (Math.random() - 0.5) * 1.8;
                v.y += (Math.random() - 0.5) * 0.4;
                v.z += (Math.random() - 0.5) * 1.8;
            });
            geometry.computeVertexNormals();
        } else if (geometry.attributes && geometry.attributes.position) {
            const pos = geometry.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 1.8);
                pos.setY(i, pos.getY(i) + (Math.random() - 0.5) * 0.4); 
                pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * 1.8);
            }
            geometry.computeVertexNormals();
        }
    }

    let gridSegments = 1;
    if (options.isMixed || Math.random() < 0.3) {
        gridSegments = Math.random() > 0.5 ? 2 : 3;
    }
    
    this.material = this.createSketchMats({ gridSegments });
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
      
      // ✨ 规整的方块抖动极小（像尺子画的），涂鸦方块抖动极大
      const jitter = this.isNeat ? 1 : 6;
      const cpJitter = this.isNeat ? 2 : 12;
      const drawCount = this.isNeat ? 2 : 3; // 规整的笔触少画一次，显得干净

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
    const createTex = (text, isTop) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 256;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = '#FFFFFF'; 
      ctx.fillRect(0, 0, 256, 256);
      
      // 只有涂鸦方块才有乱甩的墨水渍
      if (!this.isNeat) {
          ctx.fillStyle = '#1A1A1A';
          for(let i=0; i<5; i++) {
              ctx.beginPath();
              ctx.arc(Math.random()*256, Math.random()*256, Math.random()*2, 0, Math.PI*2);
              ctx.fill();
          }
      }
      
      ctx.strokeStyle = '#1A1A1A';
      const b = 6; 
      const os = this.isNeat ? 5 : 20; // 规整的方块出头很少
      
      this.drawSketchLine(ctx, -os, b, 256+os, b, 5); 
      this.drawSketchLine(ctx, -os, 256-b, 256+os, 256-b, 5); 
      this.drawSketchLine(ctx, b, -os, b, 256+os, 5); 
      this.drawSketchLine(ctx, 256-b, -os, 256-b, 256+os, 5); 

      if (opts.gridSegments && opts.gridSegments > 1) {
        const step = 256 / opts.gridSegments;
        for (let i = 1; i < opts.gridSegments; i++) {
            this.drawSketchLine(ctx, i * step, -os, i * step, 256+os, 3); 
            this.drawSketchLine(ctx, -os, i * step, 256+os, i * step, 3); 
        }
      }

      if (text) {
        ctx.fillStyle = '#1A1A1A';
        ctx.font = '900 80px "-apple-system", "PingFang SC", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.save(); 
        // 规整方块文字居中且端正，涂鸦方块文字歪斜
        const tJitter = this.isNeat ? 0 : 10;
        const rot = this.isNeat ? 0 : (Math.random() - 0.5) * 0.3;
        ctx.translate(128 + (Math.random()-0.5)*tJitter, 128 + (Math.random()-0.5)*tJitter); 
        ctx.rotate(rot); 
        ctx.fillText(text, 0, 0); 
        ctx.restore();
      }
      
      const tex = new THREE.CanvasTexture(canvas);
      tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
      return tex;
    };

    const sideTex = createTex(opts.text, false);
    const topTex = createTex('', true); 

    const sideMat = new THREE.MeshBasicMaterial({ map: sideTex, transparent: true });
    const topMat = new THREE.MeshBasicMaterial({ map: topTex, transparent: true });

    return [sideMat, sideMat, topMat, topMat, sideMat, sideMat];
  }

  setSketchText(text) {
      const mesh = this.instance.children[0];
      if (mesh && mesh.material) {
          if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose());
          else mesh.material.dispose();
          mesh.material = this.createSketchMats({ text, gridSegments: 1 });
      }
  }
}