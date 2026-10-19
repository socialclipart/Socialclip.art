# Glitch-Postprocessing: RGB-Split, Slice-Shift, Zoom-Punch, Grain, Vignette
import numpy as np, subprocess, sys
# Aufruf: python3 -I post.py <framesordner> <sound.wav> <ausgabe.mp4> [intensitaet 0..1.5]
import json, os
src,dst_wav,out=sys.argv[1],sys.argv[2],sys.argv[3]
AMT=float(sys.argv[4]) if len(sys.argv)>4 else 1.0
meta=json.load(open(os.path.join(src,'hits.json')))
W,H,FPS=1080,1920,meta['fps']
HITS=meta['hits']; BIG=set(meta['big'])
dec=subprocess.Popen(['ffmpeg','-loglevel','error','-framerate',str(FPS),'-i',f'{src}/f%05d.jpg','-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE)
enc=subprocess.Popen(['ffmpeg','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-i',dst_wav,
  '-c:v','libx264','-preset','slow','-crf','17','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',out],stdin=subprocess.PIPE)
yy,xx=np.mgrid[0:H,0:W]; vig=(1-.45*(((xx-W/2)/(W*.75))**2+((yy-H/2)/(H*.7))**2)).clip(.55,1)[...,None].astype(np.float32)
rng=np.random.default_rng(1); grains=[rng.normal(0,7,(H,W,1)).astype(np.float32) for _ in range(4)]
i=0
while True:
    buf=dec.stdout.read(W*H*3)
    if len(buf)<W*H*3: break
    T=i/FPS; img=np.frombuffer(buf,np.uint8).reshape(H,W,3)
    g=0.0;big=False
    for h in HITS:
        if 0<=T-h<.35:
            v=np.exp(-(T-h)/.09)*(1.6 if h in BIG else 1); 
            if v>g: g=v; big=h in BIG
    g=min(g,1.6)*AMT
    # zoom punch
    s=1+.07*g
    if s>1.001:
        ys=((np.arange(H)-H/2)/s+H/2).astype(int).clip(0,H-1); xs=((np.arange(W)-W/2)/s+W/2).astype(int).clip(0,W-1)
        img=img[ys][:,xs]
    img=img.astype(np.float32)
    k=int(26*g)
    if k:
        img[...,0]=np.roll(img[...,0],k,axis=1); img[...,2]=np.roll(img[...,2],-k,axis=1)
    if g>.45:
        r=np.random.default_rng(i)
        for _ in range(int(3+5*g)):
            y0=r.integers(0,H-40); hh=int(r.integers(12,140)); sh=int(r.choice([-1,1])*r.integers(30,220)*g)
            img[y0:y0+hh]=np.roll(img[y0:y0+hh],sh,axis=1)
            if big and r.random()<.3: img[y0:y0+hh]=255-img[y0:y0+hh]
    img=img*vig+grains[i%4]
    img[::4]*=.96  # leichte Scanlines
    enc.stdin.write(img.clip(0,255).astype(np.uint8).tobytes()); i+=1
enc.stdin.close(); enc.wait(); print('frames',i)
