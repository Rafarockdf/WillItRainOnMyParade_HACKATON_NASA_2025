from collect_api_giovanni import collect
from transform import transform
from mapeamento_pontos_coletaveis import mapeamento
from load import load_data_to_db

#timezone = colect_timezone()
lista_merra = ['M2I1NXLFO_5_12_4_QLML','M2I1NXLFO_5_12_4_TLML','M2I1NXLFO_5_12_4_SPEEDLML']
lista_merra2 = ['M2T1NXFLX_5_12_4_PRECTOTCORR','M2T1NXSLV_5_12_4_TQV']
time_start = "2020-01-01T00:00:00"
time_end = "2025-09-28T00:00:00"


list_locations,is_land_mask = mapeamento()

df_merra,df_merra2 = collect(lista_merra,lista_merra2,list_locations,time_start,time_end)

df_final = transform(df_merra,df_merra2)

load_data_to_db(df_final,'ClimateDataLocation')