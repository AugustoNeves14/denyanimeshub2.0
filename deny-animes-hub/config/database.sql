-- Deny Animes Hub - Database Schema
-- PostgreSQL schema for Akatsuki platform

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Animes table
CREATE TABLE IF NOT EXISTS animes (
    id INTEGER PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    original_title VARCHAR(255),
    description TEXT,
    synopsis TEXT,
    poster_path VARCHAR(500),
    backdrop_path VARCHAR(500),
    trailer_url VARCHAR(500),
    year INTEGER,
    rating DECIMAL(3,2),
    genres TEXT[],
    status VARCHAR(50),
    episode_count INTEGER DEFAULT 0,
    season_count INTEGER DEFAULT 1,
    duration INTEGER,
    studio VARCHAR(255),
    age_rating VARCHAR(10),
    trending BOOLEAN DEFAULT FALSE,
    popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Episodes table
CREATE TABLE IF NOT EXISTS episodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anime_id INTEGER REFERENCES animes(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    season_number INTEGER DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(500),
    video_url VARCHAR(500),
    duration INTEGER,
    air_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(anime_id, episode_number, season_number)
);

-- User progress tracking
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    anime_id INTEGER REFERENCES animes(id) ON DELETE CASCADE,
    episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
    progress_seconds INTEGER DEFAULT 0,
    total_seconds INTEGER,
    is_completed BOOLEAN DEFAULT FALSE,
    last_watched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, episode_id)
);

-- User favorites
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    anime_id INTEGER REFERENCES animes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, anime_id)
);

-- User ratings
CREATE TABLE IF NOT EXISTS user_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    anime_id INTEGER REFERENCES animes(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, anime_id)
);

-- Watch history
CREATE TABLE IF NOT EXISTS watch_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    anime_id INTEGER REFERENCES animes(id) ON DELETE CASCADE,
    episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
    watch_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    watch_duration INTEGER
);

-- Genres table
CREATE TABLE IF NOT EXISTS genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- Anime genres junction table
CREATE TABLE IF NOT EXISTS anime_genres (
    anime_id INTEGER REFERENCES animes(id) ON DELETE CASCADE,
    genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (anime_id, genre_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_animes_year ON animes(year);
CREATE INDEX IF NOT EXISTS idx_animes_rating ON animes(rating DESC);
CREATE INDEX IF NOT EXISTS idx_animes_trending ON animes(trending);
CREATE INDEX IF NOT EXISTS idx_animes_popular ON animes(popular);
CREATE INDEX IF NOT EXISTS idx_animes_genres ON animes USING gin(genres);
CREATE INDEX IF NOT EXISTS idx_episodes_anime_id ON episodes(anime_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_animes_title_trgm ON animes USING gin(title gin_trgm_ops);

-- Create full text search indexes
CREATE INDEX IF NOT EXISTS idx_animes_search ON animes USING gin(to_tsvector('english', title || ' ' || description));

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_animes_updated_at BEFORE UPDATE ON animes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_episodes_updated_at BEFORE UPDATE ON episodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_ratings_updated_at BEFORE UPDATE ON user_ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample genres
INSERT INTO genres (name, description) VALUES
('Action', 'High-intensity combat and fighting scenes'),
('Adventure', 'Journey and exploration themes'),
('Comedy', 'Humorous and light-hearted content'),
('Drama', 'Emotional and serious storytelling'),
('Fantasy', 'Magical and supernatural elements'),
('Romance', 'Love and relationship themes'),
('Sci-Fi', 'Science fiction and futuristic elements'),
('Slice of Life', 'Everyday life and realistic situations'),
('Supernatural', 'Paranormal and mystical elements'),
('Thriller', 'Suspenseful and intense narratives');

-- Insert sample animes
INSERT INTO animes (id, title, description, poster_path, backdrop_path, year, rating, genres, status, episode_count, trending, popular) VALUES
(1, 'Naruto Shippuden', 'The epic continuation of Naruto''s journey', '/1pdfLvkbY9ohJlCjQH2CZwqY5r5.jpg', '/kSvkgrNYbWg7vh6pHeI8v7K3J5.jpg', 2007, 9.2, ARRAY['Action', 'Adventure', 'Fantasy'], 'Finished', 500, true, true),
(2, 'Attack on Titan', 'Humanity''s last stand against giant humanoid creatures', '/qNBAXBIQlnOThr96vQ8Lsed4M.jpg', '/kWytkw2zE5w1GjZ1YKfnhH9K3J5.jpg', 2013, 9.1, ARRAY['Action', 'Drama', 'Fantasy'], 'Finished', 75, true, true),
(3, 'Demon Slayer', 'A boy''s journey to save his sister from demon curse', '/3XHCBwZGAdqG07Ni9GzO4WKaHM4.jpg', '/kZv92eH0e5w1GjZ1YKfnhH9K3J5.jpg', 2019, 8.7, ARRAY['Action', 'Supernatural', 'Adventure'], 'Ongoing', 44, true, true),
(4, 'Jujutsu Kaisen', 'High school student becomes host to a powerful curse', '/9JbgT0uLRDbVXd9QDXENwUDXn1e.jpg', '/kSvkgrNYbWg7vh6pHeI8v7K3J5.jpg', 2020, 8.8, ARRAY['Action', 'Supernatural', 'Fantasy'], 'Ongoing', 47, true, true),
(5, 'One Piece', 'The ultimate pirate adventure', '/kSvkgrNYbWg7vh6pHeI8v7K3J5.jpg', '/kWytkw2zE5w1GjZ1YKfnhH9K3J5.jpg', 1999, 9.0, ARRAY['Action', 'Adventure', 'Comedy'], 'Ongoing', 1000, true, true);

-- Insert sample episodes
INSERT INTO episodes (anime_id, episode_number, season_number, title, description, thumbnail_url, duration) VALUES
(1, 1, 1, 'Homecoming', 'Naruto returns to the village after 2.5 years', '/episodes/naruto/1.jpg', 23),
(1, 2, 1, 'The Akatsuki Makes Its Move', 'The Akatsuki organization begins their plan', '/episodes/naruto/2.jpg', 23),
(2, 1, 1, 'To You, in 2000 Years', 'Humanity''s last stand begins', '/episodes/aot/1.jpg', 24),
(2, 2, 1, 'That Day', 'Eren''s past is revealed', '/episodes/aot/2.jpg', 24),
(3, 1, 1, 'Cruelty', 'Tanjiro''s family is slaughtered', '/episodes/demon-slayer/1.jpg', 23),
(3, 2, 1, 'Trainer Sakonji', 'Tanjiro begins his training', '/episodes/demon-slayer/2.jpg', 23);