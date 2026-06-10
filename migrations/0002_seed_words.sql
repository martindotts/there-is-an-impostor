-- Seed data in English ('en') and Spanish ('es'): 3 words per category, with
-- single-word, non-obvious impostor hints. Explicit ids so translation rows
-- can reference them (3 per category: 1-3 food, 4-6 animals, 7-9 places,
-- 10-12 sports, 13-15 screen, 16-18 professions, 19-21 objects, 22-24 music).

INSERT INTO categories (id, slug, emoji) VALUES
  (1, 'food', '🍕'),
  (2, 'animals', '🐾'),
  (3, 'places', '✈️'),
  (4, 'sports', '🏅'),
  (5, 'screen', '🎬'),
  (6, 'professions', '💼'),
  (7, 'objects', '🏠'),
  (8, 'music', '🎵');

INSERT INTO category_translations (category_id, locale, name) VALUES
  (1, 'en', 'Food & Drinks'),        (1, 'es', 'Comida y Bebidas'),
  (2, 'en', 'Animals'),              (2, 'es', 'Animales'),
  (3, 'en', 'Places'),               (3, 'es', 'Lugares'),
  (4, 'en', 'Sports & Games'),       (4, 'es', 'Deportes y Juegos'),
  (5, 'en', 'Movies & TV'),          (5, 'es', 'Cine y TV'),
  (6, 'en', 'Professions'),          (6, 'es', 'Profesiones'),
  (7, 'en', 'Household Objects'),    (7, 'es', 'Objetos del Hogar'),
  (8, 'en', 'Music'),                (8, 'es', 'Música');

INSERT INTO words (id, category_id) VALUES
  (1, 1), (2, 1), (3, 1),
  (4, 2), (5, 2), (6, 2),
  (7, 3), (8, 3), (9, 3),
  (10, 4), (11, 4), (12, 4),
  (13, 5), (14, 5), (15, 5),
  (16, 6), (17, 6), (18, 6),
  (19, 7), (20, 7), (21, 7),
  (22, 8), (23, 8), (24, 8);

INSERT INTO word_translations (word_id, locale, word, impostor_hint) VALUES
  -- Food & Drinks
  (1, 'en', 'Pizza', 'Slices'),
  (1, 'es', 'Pizza', 'Porciones'),
  (2, 'en', 'Sushi', 'Raw'),
  (2, 'es', 'Sushi', 'Crudo'),
  (3, 'en', 'Chocolate', 'Sweet'),
  (3, 'es', 'Chocolate', 'Dulce'),

  -- Animals
  (4, 'en', 'Elephant', 'Huge'),
  (4, 'es', 'Elefante', 'Enorme'),
  (5, 'en', 'Penguin', 'Ice'),
  (5, 'es', 'Pingüino', 'Hielo'),
  (6, 'en', 'Snake', 'Scales'),
  (6, 'es', 'Serpiente', 'Escamas'),

  -- Places
  (7, 'en', 'Beach', 'Summer'),
  (7, 'es', 'Playa', 'Verano'),
  (8, 'en', 'Hospital', 'Waiting'),
  (8, 'es', 'Hospital', 'Espera'),
  (9, 'en', 'Library', 'Silence'),
  (9, 'es', 'Biblioteca', 'Silencio'),

  -- Sports & Games
  (10, 'en', 'Soccer', 'Popular'),
  (10, 'es', 'Fútbol', 'Popular'),
  (11, 'en', 'Chess', 'Strategy'),
  (11, 'es', 'Ajedrez', 'Estrategia'),
  (12, 'en', 'Swimming', 'Water'),
  (12, 'es', 'Natación', 'Agua'),

  -- Movies & TV
  (13, 'en', 'Titanic', 'Tragedy'),
  (13, 'es', 'Titanic', 'Tragedia'),
  (14, 'en', 'Star Wars', 'Space'),
  (14, 'es', 'Star Wars', 'Espacio'),
  (15, 'en', 'Harry Potter', 'Magic'),
  (15, 'es', 'Harry Potter', 'Magia'),

  -- Professions
  (16, 'en', 'Doctor', 'Health'),
  (16, 'es', 'Médico', 'Salud'),
  (17, 'en', 'Firefighter', 'Sirens'),
  (17, 'es', 'Bombero', 'Sirenas'),
  (18, 'en', 'Chef', 'Apron'),
  (18, 'es', 'Chef', 'Delantal'),

  -- Household Objects
  (19, 'en', 'Mirror', 'Glass'),
  (19, 'es', 'Espejo', 'Vidrio'),
  (20, 'en', 'Pillow', 'Soft'),
  (20, 'es', 'Almohada', 'Suave'),
  (21, 'en', 'Umbrella', 'Foldable'),
  (21, 'es', 'Paraguas', 'Plegable'),

  -- Music
  (22, 'en', 'Guitar', 'Strings'),
  (22, 'es', 'Guitarra', 'Cuerdas'),
  (23, 'en', 'Microphone', 'Voice'),
  (23, 'es', 'Micrófono', 'Voz'),
  (24, 'en', 'Drums', 'Rhythm'),
  (24, 'es', 'Batería', 'Ritmo');
