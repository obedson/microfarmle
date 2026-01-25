-- Create farm_records table
CREATE TABLE IF NOT EXISTS farm_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  livestock_type VARCHAR(50) NOT NULL,
  livestock_count INTEGER NOT NULL DEFAULT 0,
  feed_consumption DECIMAL(10,2) NOT NULL DEFAULT 0,
  mortality_count INTEGER NOT NULL DEFAULT 0,
  expenses DECIMAL(10,2) NOT NULL DEFAULT 0,
  expense_category VARCHAR(100),
  notes TEXT,
  record_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_farm_records_farmer_id ON farm_records(farmer_id);
CREATE INDEX idx_farm_records_property_id ON farm_records(property_id);
CREATE INDEX idx_farm_records_date ON farm_records(record_date);
CREATE INDEX idx_farm_records_livestock_type ON farm_records(livestock_type);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_farm_records_updated_at 
    BEFORE UPDATE ON farm_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
