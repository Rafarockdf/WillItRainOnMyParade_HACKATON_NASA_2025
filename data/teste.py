from roaring_landmask import RoaringLandmask
import numpy as np # 1. Importe a biblioteca NumPy

# Inicializa a máscara
land_mask = RoaringLandmask.new()

# Pontos conhecidos
ponto_terra_brasil = [-15.78, -47.92]  # Brasília (Terra)
ponto_mar_pacifico = [0, -150]         # Oceano Pacífico (Mar)
ponto_terra_egito = [30.04, 31.23]     # Cairo (Terra)
ponto_mar_atlantico = [-22.9, -43.1]   # Perto do Rio de Janeiro (Mar)

# Prepara as listas de pontos
lats = [ponto_terra_brasil[0], ponto_mar_pacifico[0], ponto_terra_egito[0], ponto_mar_atlantico[0]]
lons = [ponto_terra_brasil[1], ponto_mar_pacifico[1], ponto_terra_egito[1], ponto_mar_atlantico[1]]

# 2. Converta as listas para arrays NumPy antes de chamar a função
is_land = land_mask.contains_many(np.array(lons), np.array(lats))

print(f"Brasília é terra?   Esperado: True.  Resultado: {is_land[0]}")
print(f"Pacífico é terra?   Esperado: False. Resultado: {is_land[1]}")
print(f"Cairo é terra?      Esperado: True.  Resultado: {is_land[2]}")
print(f"Atlântico é terra?  Esperado: False. Resultado: {is_land[3]}")