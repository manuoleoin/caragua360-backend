-- Retire o card "Preserve as trilhas e áreas naturais" das
-- ORIENTAÇÕES DO CARAGUA360 (aba Preservação).
--
-- O conteúdo é despublicado (published = false) em vez de apagado,
-- pois o endpoint GET /sustainability já filtra apenas conteúdos
-- publicados, fazendo o sumir do tópico de orientações sem perder
-- o histórico do registro.
UPDATE `SustainabilityContent`
SET `published` = false
WHERE `slug` = 'preserve-trilhas';
