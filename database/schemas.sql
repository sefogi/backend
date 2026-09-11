CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    location VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO events
(name, description, date, location, price, image)
VALUES
(
    'Rock Ecológico',
    'Festival de rock comprometido con el medio ambiente.',
    '2026-10-15',
    'Tuluá',
    15.00,
    'rock-ecologico.jpg'
);

INSERT INTO events
(name, description, date, location, price, image)
VALUES
(
    'Running por el río Tuluá',
    'Carrera ecológica por el río Tuluá.',
    '2026-11-02',
    'Tuluá',
    10.00,
    'running.jpg'
);