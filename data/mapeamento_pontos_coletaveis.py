#%% 
import numpy as np
import pandas as pd
from roaring_landmask import RoaringLandmask
import matplotlib.pyplot as plt 

def mapeamento():
    land_mask = RoaringLandmask.new()

    lat_l = np.arange(-90, 90+0.5, 0.5)
    lon_l = np.arange(-180, 180+0.625, 0.625)

    lat_c = np.array([i for i in lat_l for j in lon_l])
    lon_c = np.array([j for i in lat_l for j in lon_l])

    # Remove região abaixo de -60° (Antártica)
    not_ice = [False if i < -60 else True for i in lat_c]
    lon_c = lon_c[not_ice]
    lat_c = lat_c[not_ice]

    is_land_mask = land_mask.contains_many(lon_c, lat_c)

    # Cria lista de tuplas (lat, lon) apenas para pontos em terra
    coords = list(zip(lat_c[is_land_mask], lon_c[is_land_mask]))

    return coords, is_land_mask

