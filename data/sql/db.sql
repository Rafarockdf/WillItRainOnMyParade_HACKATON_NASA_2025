
DROP TABLE modelos_treinados;
DROP TABLE previsoes;
DROP TABLE historico_localizacao;

-- Tabela para previsões históricas
CREATE TABLE previsoes (
    lat FLOAT NOT NULL,
    lon FLOAT NOT NULL,
    data TIMESTAMP NOT NULL,
    resultado JSONB NOT NULL,
    PRIMARY KEY (lat, lon, data)
);

-- Tabela para modelos treinados (armazenando como arquivo binário ou string base64)
CREATE TABLE modelos_treinados (
    lat FLOAT NOT NULL,
    lon FLOAT NOT NULL,
    tipo VARCHAR(32) NOT NULL,
    modelo_pickle BYTEA NOT NULL,
    PRIMARY KEY (lat, lon, tipo)
);
CREATE TABLE historico_localizacao (
    lat FLOAT NOT NULL,
    lon FLOAT NOT NULL,
    timestamp_local TIMESTAMP NOT NULL,
    tlml FLOAT,
    qlml FLOAT,
    speedlml FLOAT,
    prectotcorr FLOAT,
    tqv FLOAT,
    PRIMARY KEY (lat, lon, timestamp_local)
);