CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users(
	id uuid UNIQUE DEFAULT uuid_generate_v4() NOT NULL,
	username VARCHAR(30) UNIQUE NOT NULL,
	first_name VARCHAR(30),
	last_name VARCHAR(30),
	email VARCHAR(30) UNIQUE NOT NULL,
	passhash VARCHAR(128) NOT NULL
);

CREATE TABLE flies(
	id SERIAL UNIQUE PRIMARY KEY,
	name VARCHAR(60) NOT NULL,
    user_id UUID NOT NULL references users(id),
    points integer DEFAULT 0
);

CREATE TABLE

INSERT INTO flies (user_id, name) SELECT id, 'Pheasant Tail' from users;

CREATE TABLE favorites(
	id SERIAL UNIQUE NOT NULL,
	user_id uuid references users(id),
	fly_id integer references flies(id)
)