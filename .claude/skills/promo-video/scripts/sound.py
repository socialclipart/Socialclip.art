# Erzeugt den Soundtrack (lizenzfrei, synthetisch). Aufruf: python3 -I sound.py <ausgabe.wav>
# Die Zeiten der Effekte unten an die HITS der jeweiligen Szene anpassen.
import numpy as np, wave, sys
sr=44100; dur=25.0; n=int(sr*dur); t=np.arange(n)/sr; out=np.zeros((n,2))
rng=np.random.default_rng(3)
def add(sig,at,pan=0):
    i=int(at*sr); j=min(n,i+len(sig))
    if j<=i: return
    out[i:j,0]+=sig[:j-i]*(1-pan)/1; out[i:j,1]+=sig[:j-i]*(1+pan)/1
def ev(d,a=.002,r=.1):
    m=int(d*sr); e=np.exp(-np.arange(m)/sr/r); k=max(1,int(a*sr)); e[:k]*=np.linspace(0,1,k); return e
def kick(v=1): d=.45; tt=np.arange(int(d*sr))/sr; f=45+130*np.exp(-tt*35); return v*np.tanh(2*np.sin(2*np.pi*np.cumsum(f)/sr))*ev(d,.001,.14)
def clap(v=.35): d=.25; x=rng.standard_normal(int(d*sr)); x=x-np.convolve(x,np.ones(8)/8,'same'); return v*x*ev(d,.001,.06)
def hat(v=.08): d=.05; x=rng.standard_normal(int(d*sr)); x=x-np.convolve(x,np.ones(4)/4,'same'); return v*x*ev(d,.001,.012)
def bass(f,d,v=.35): tt=np.arange(int(d*sr))/sr; s=np.tanh(3*np.sin(2*np.pi*f*tt)); return v*s*ev(d,.005,d*.6)
def impact(v=.8): d=1.4; tt=np.arange(int(d*sr))/sr; s=np.sin(2*np.pi*(38+60*np.exp(-tt*8))*tt); x=rng.standard_normal(len(tt)); return v*(np.tanh(2*s)*ev(d,.001,.5)+.25*x*ev(d,.001,.08))
def riser(d,v=.25):
    m=int(d*sr); x=rng.standard_normal(m); tt=np.arange(m)/sr
    k=np.linspace(60,4,m).astype(int); y=np.array([0.0]*m); cs=np.cumsum(x); 
    y=(cs-np.roll(cs,1))  # placeholder
    s=np.sin(2*np.pi*np.cumsum(200+1800*(tt/d)**2)/sr)*.3
    return v*(x*.5+s)*(tt/d)**2
def whoosh(d=.35,v=.3): m=int(d*sr); x=rng.standard_normal(m); x=np.convolve(x,np.ones(20)/20,'same'); return v*x*np.sin(np.linspace(0,np.pi,m))**3
def blip(f,v=.2,d=.12): tt=np.arange(int(d*sr))/sr; return v*np.sign(np.sin(2*np.pi*f*tt))*.5*ev(d,.001,.03)
def bell(f,v=.2,d=1.5): tt=np.arange(int(d*sr))/sr; return v*(np.sin(2*np.pi*f*tt)+.4*np.sin(2*np.pi*2.01*f*tt)+.15*np.sin(2*np.pi*3*f*tt))*ev(d,.002,.4)
B=.5
roots={0:55,4.5:43.65,8:49,12:41.2,14:49,19:55}
def root(x): return [v for k,v in roots.items() if x>=k][-1]
# Hook: harte Schlaege
for i in range(4): add(impact(.9),i*.25); add(clap(.3),i*.25)
add(impact(1),1.0); add(riser(.5,.4),1.0)
for k in range(int(25/B*4)):
    at=1.5+k*B/4
    if at>24.2: break
    if 18.2<at<19.0: continue
    st=k%16
    if st%4==0: add(kick(),at)
    if st in (4,12): add(clap(.45),at)
    add(hat(.06 if st%2 else .11),at,pan=.3 if st%2 else -.3)
    if st in (0,3,6,8,10,11,14): add(bass(root(at),B/2,.4),at)
for i in range(5): add(impact(.45),1.5+i*.4); add(whoosh(.2,.25),1.5+i*.4-.12)
add(impact(.6),3.5); add(blip(1320,.15),3.75); add(impact(.5),4.0)
add(impact(.9),4.5); add(whoosh(1.0,.35),4.6); add(riser(.5,.35),5.5)
for i in range(7): add(blip(500+i*80,.12,.08),6.0+i*.05,pan=(i-3)/4)
add(whoosh(.25,.4),6.4); add(impact(.8),6.45)
for i in range(7): add(whoosh(.3,.08),6.6+i*.02)
add(impact(.7),7.0); add(bell(330,.2),7.2); add(impact(.7),7.35)
add(blip(1600,.25,.06),8.55); add(whoosh(.4,.3),8.9)
for k in range(22): add(blip(2600+(k%3)*200,.04,.03),9.4+k/22)
add(whoosh(.3,.25),10.5)
for i in range(7): add(blip(700+i*60,.08,.06),10.6+i*.07)
for i in range(4): add(bell([440,554,659,880][i],.16,.8),11.0+i*.25)
for i in range(4): add(impact(.8),12+i*.5); add(whoosh(.3,.3),12+i*.5-.15)
for i in range(3): add(impact(.8),14+i*.8); add(bell([220,330,440][i],.2,1),14+i*.8)
for i in range(30): add(blip(1200+i*25,.06,.05),16.5+i*.045,pan=((i%5)-2)/3)
add(riser(1.0,.45),18.0); add(impact(1.2),19.0); add(bell(110,.25,4),19.0)
add(impact(.7),19.8); add(whoosh(.6,.2),19.9)
add(impact(1),20.5); add(bell(659,.15,2),20.5); add(bell(880,.12,2),21.0)
add(blip(1600,.25,.06),22.1); add(bell(1318,.12,2),22.15)
# pad bed
pad=sum(np.sin(2*np.pi*f*t+.4*np.sin(2*np.pi*.3*t)) for f in (220,277.2,329.6,440))/4
out+=(.05*pad*np.clip((t-1.5)/1,0,1))[:,None]
out*=np.clip((dur-t)/1.2,0,1)[:,None]
out=np.tanh(out*1.3); out/=np.max(np.abs(out))*1.05
w=wave.open(sys.argv[1],'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes((out*32767).astype(np.int16).tobytes()); w.close()
