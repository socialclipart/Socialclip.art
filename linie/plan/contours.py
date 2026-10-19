import json, numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage import measure

N = 900
def resample(c, n=N):
    d = np.sqrt(((np.diff(c, axis=0))**2).sum(1)); s = np.concatenate([[0], np.cumsum(d)])
    t = np.linspace(0, s[-1], n, endpoint=False)
    return np.stack([np.interp(t, s, c[:, 0]), np.interp(t, s, c[:, 1])], 1)
def orient(c):
    # clockwise in screen coords, start at the topmost point
    a = 0.5 * np.sum(c[:-1, 0] * c[1:, 1] - c[1:, 0] * c[:-1, 1])
    if a < 0: c = c[::-1]
    i = np.argmin(c[:, 1]); return np.roll(c, -i, 0)
def contour_from_mask(m, sigma=2.0):
    f = ndi.gaussian_filter(m.astype(float), sigma)
    cs = measure.find_contours(f, 0.5)
    c = max(cs, key=len)[:, ::-1]  # (row,col) -> (x,y)
    return orient(resample(c))

out = {}
for name, thr, close in [('cafe', .10, 9), ('schere', .10, 5), ('hammer', .08, 5), ('rose', .09, 7)]:
    im = np.asarray(Image.open(f'assets/photos/{["1-cafe","2-schere","3-hammer","4-rose"][["cafe","schere","hammer","rose"].index(name)]}.png').convert('RGB')).astype(float) / 255
    lum = ndi.gaussian_filter(im.max(2), 2)
    m = lum > thr
    m = ndi.binary_closing(m, iterations=close)
    m = ndi.binary_fill_holes(m)
    lab, n = ndi.label(m); sizes = ndi.sum(m, lab, range(1, n + 1)); m = lab == (np.argmax(sizes) + 1)
    c = contour_from_mask(m)
    out[name] = np.round(c, 1).tolist()
    print(name, 'area%', round(m.mean() * 100, 1), 'bbox', c.min(0).round(), c.max(0).round())
# logo halves, mapped to final video coords: centre (540, 700), 1.9 px per svg unit
for i in (0, 1):
    m = np.asarray(Image.open(f'assets/sym{i}.png').convert('L')) > 128
    c = contour_from_mask(m, 1.0)
    c = (c - 500) * (1.9 / 4) + np.array([540, 700])
    out[f'sym{i}'] = np.round(c, 1).tolist()
json.dump(out, open('src/contours.json', 'w'))
