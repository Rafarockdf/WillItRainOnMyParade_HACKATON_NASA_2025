#%% 
import numpy as np
import pandas as pd
from roaring_landmask import RoaringLandmask
import matplotlib.pyplot as plt 

land_mask = RoaringLandmask.new()

# Verificando quantas coordenadas estão presentes na terra

# %%
lat_l = np.arange(-90,90+0.5,0.5)
lon_l = np.arange(-180,180+0.625,0.625)
# %%
lat_c = np.array([i for i in lat_l for j in lon_l])
lon_c = np.array([j for i in lat_l for j in lon_l])


america_mask = [True if (i < -20) else False for i in lon_c]
lon_c = lon_c[america_mask]
lat_c = lat_c[america_mask]

not_ice = [False if i < -60 else True for i in lat_c]
lon_c = lon_c[not_ice]
lat_c = lat_c[not_ice]

is_land_mask = land_mask.contains_many(lon_c, lat_c)

# %%
plt.scatter(lon_c[is_land_mask], lat_c[is_land_mask])
t_combinacoes = sum(is_land_mask)


#####################################################

# Verificando quanto de espaço teria todas essas combinações

#%% 
lat_land = lat_c[is_land_mask]
lon_land = lon_c[is_land_mask]




