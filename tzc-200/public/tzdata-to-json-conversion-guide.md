# TZDATA to JSON Conversion Guide

## Overview
This document provides step-by-step instructions for converting IANA tzdata files into the comprehensive timezone JSON format used by the Time Zone Converter application.

## Prerequisites
- Python 3.x
- IANA tzdata files (downloaded and extracted)
- Access to the conversion script: `rebuild_timezone_json.py`

## Step-by-Step Process

### 1. Download Latest IANA tzdata
```bash
# Download the latest tzdata release from IANA
wget https://data.iana.org/time-zones/releases/tzdata2025b.tar.gz

# Extract the files
mkdir iana-tzdata
cd iana-tzdata
tar -xzf ../tzdata2025b.tar.gz
```

### 2. Verify Required Source Files
Ensure these key files are present in the `iana-tzdata/` directory:
- `zone.tab` - Primary timezone to country mapping
- `zone1970.tab` - Enhanced timezone data with coordinates
- `iso3166.tab` - Country code to country name mapping
- `backward` - Timezone aliases and links
- `asia`, `africa`, `america`, etc. - Regional timezone data files

### 3. Run the Conversion Script
```bash
python3 rebuild_timezone_json.py
```

### 4. Conversion Process Details

#### 4.1 Country Mapping Loading
- Loads `iso3166.tab` to create country code → country name mapping
- Example: "US" → "United States"

#### 4.2 Zone Data Loading
- Primary source: `zone1970.tab` (preferred, includes coordinates)
- Fallback source: `zone.tab` (basic timezone data)
- Extracts: country codes, coordinates, timezone IDs, comments

#### 4.3 Timezone ID Parsing
The script parses timezone IDs using these rules:

**Single Part (e.g., "UTC", "GMT"):**
- Region: empty
- City: the ID itself
- State: empty

**Two Parts (e.g., "America/New_York"):**
- Region: first part ("America")
- City: second part with underscores replaced by spaces ("New York")
- State: determined by special US city mapping (see 4.4)

**Three Parts (e.g., "America/Indiana/Indianapolis"):**
- Region: first part ("America")
- State: second part with underscores replaced ("Indiana")
- City: third part with underscores replaced ("Indianapolis")

#### 4.4 Special US City-State Mapping
For major US cities that are also state names or need state context:
```python
us_city_states = {
    'New_York': 'New York',
    'Los_Angeles': 'California', 
    'Chicago': 'Illinois',
    'Phoenix': 'Arizona',
    'Denver': 'Colorado',
    'Detroit': 'Michigan',
    'Anchorage': 'Alaska',
    'Adak': 'Alaska',
    'Honolulu': 'Hawaii'
}
```

#### 4.5 Alias Processing
- Loads `backward` file for timezone aliases
- Creates entries for each alias pointing to canonical timezone
- Adds `canonical` field to alias entries

#### 4.6 Search Text Generation
Creates comprehensive search text including:
- Timezone name, city, state, region
- Country codes and country names
- Special city aliases (e.g., Mumbai for Kolkata)

### 5. Output JSON Structure
```json
{
  "version": "D.24.4",
  "generated": "2025-06-29T04:15:00.000Z",
  "source": "tzdata2025b",
  "description": "Comprehensive timezone database with country names and enhanced search",
  "total": 659,
  "timezones": [
    {
      "id": "America/New_York",
      "name": "New York",
      "region": "America",
      "city": "New York",
      "state": "New York",
      "countries": ["US"],
      "displayName": "New York (America)",
      "countryNames": ["United States"],
      "searchText": "united states states united new york us america"
    }
  ]
}
```

### 6. Key Fields Explained

- **id**: Official IANA timezone identifier
- **name**: Human-readable timezone name (usually city)
- **region**: Geographic region (America, Europe, Asia, etc.)
- **city**: City name with underscores replaced by spaces
- **state**: State/province name (for applicable timezones)
- **countries**: Array of ISO country codes
- **displayName**: Formatted display name for UI
- **countryNames**: Array of full country names
- **canonical**: (For aliases only) Points to the canonical timezone
- **searchText**: Comprehensive search keywords

### 7. File Locations
- **Input directory**: `/home/ubuntu/iana-tzdata/`
- **Conversion script**: `/home/ubuntu/rebuild_timezone_json.py`
- **Output file**: `/home/ubuntu/tzc-2/public/assets/comprehensive-timezones.json`

### 8. Validation Steps
After conversion, verify:
1. Total timezone count matches expected range (650-700 entries)
2. Major cities have proper state information (New York, Los Angeles, etc.)
3. Country names are properly mapped
4. Aliases point to correct canonical timezones
5. Search text includes relevant keywords

### 9. Integration with Application
1. The JSON file is automatically loaded by the React application
2. Search functionality uses the `searchText` field
3. Display formatting uses `displayName` and individual fields
4. Canonical timezone resolution uses the `canonical` field

### 10. Future Updates
When new tzdata releases are available:
1. Download and extract new tzdata files
2. Update the version number in the script
3. Run the conversion process
4. Test the application with new data
5. Deploy updated JSON file

## Troubleshooting

### Common Issues:
- **Missing state information**: Check US city-state mapping in script
- **Incorrect country names**: Verify iso3166.tab file integrity
- **Missing aliases**: Ensure backward file is properly loaded
- **Search not working**: Check searchText generation logic

### Script Modifications:
- To add new city-state mappings: Update `us_city_states` dictionary
- To add city aliases: Update `city_aliases` in `create_search_text()`
- To change output format: Modify the JSON structure creation section

## Version History
- **D.24.4**: Added US city-state mapping for proper state display
- **D.24.3**: Enhanced search functionality and country name mapping
- **D.24.2**: Initial comprehensive timezone database implementation



## CRITICAL: Information Enhancement Steps

### These steps ADD or MODIFY information beyond what's in the raw tzdata files:

#### 1. **US City-State Mapping Enhancement** ⭐ ADDS NEW DATA
**Location**: `parse_timezone_id()` function
**What it does**: Adds state information for major US cities that don't have it in the raw data
```python
us_city_states = {
    'New_York': 'New York',        # ADDS: state field for America/New_York
    'Los_Angeles': 'California',   # ADDS: state field for America/Los_Angeles
    'Chicago': 'Illinois',         # ADDS: state field for America/Chicago
    'Phoenix': 'Arizona',          # ADDS: state field for America/Phoenix
    'Denver': 'Colorado',          # ADDS: state field for America/Denver
    'Detroit': 'Michigan',         # ADDS: state field for America/Detroit
    'Anchorage': 'Alaska',         # ADDS: state field for America/Anchorage
    'Adak': 'Alaska',              # ADDS: state field for America/Adak
    'Honolulu': 'Hawaii'           # ADDS: state field for America/Honolulu
}
```
**Why needed**: Raw tzdata has "America/New_York" but no state info. We add "New York" as the state.

#### 2. **City Alias Enhancement** ⭐ ADDS NEW DATA
**Location**: `create_search_text()` function
**What it does**: Adds alternative city names for better search
```python
city_aliases = {
    'Kolkata': ['mumbai', 'bombay', 'calcutta'],  # ADDS: Mumbai alias for Kolkata
    'New_York': ['nyc'],                          # ADDS: NYC alias for New York
    'Los_Angeles': ['la'],                        # ADDS: LA alias for Los Angeles
    'Sao_Paulo': ['sao paulo'],                   # ADDS: Space-separated alias
    'Mexico_City': ['mexico city'],               # ADDS: Space-separated alias
}
```
**Why needed**: Users search for "Mumbai" but tzdata only has "Asia/Kolkata"

#### 3. **Country Name Resolution** ⭐ ENHANCES EXISTING DATA
**Location**: Main processing loop
**What it does**: Converts country codes to full country names
```
Raw tzdata: countries: ["US"]
Enhanced:   countryNames: ["United States"]
```
**Source**: Uses `iso3166.tab` to map "US" → "United States"

#### 4. **Display Name Generation** ⭐ CREATES NEW DATA
**Location**: Main processing loop
**What it does**: Creates user-friendly display names
```
Raw tzdata: "America/New_York"
Enhanced:   displayName: "New York (America)"
```

#### 5. **Comprehensive Search Text** ⭐ CREATES NEW DATA
**Location**: `create_search_text()` function
**What it does**: Combines all searchable terms into one field
```
Input:  city: "New York", state: "New York", country: "US", countryNames: ["United States"]
Output: searchText: "united states states united new york us america"
```
**Includes**: city, state, region, country codes, country names, aliases

#### 6. **Canonical Timezone Resolution** ⭐ ENHANCES EXISTING DATA
**Location**: Alias processing section
**What it does**: For aliases, adds pointer to canonical timezone
```
Raw tzdata: Link Asia/Kolkata Asia/Calcutta
Enhanced:   {id: "Asia/Calcutta", canonical: "Asia/Kolkata", ...}
```

### Steps That Only Format (No Enhancement):
- Replacing underscores with spaces in city names
- Splitting timezone IDs into region/city/state components
- Converting to JSON format
- Adding metadata (version, timestamp, etc.)

### Key Enhancement Rules:
1. **Never remove information** from the original tzdata
2. **Always preserve** the original timezone ID exactly as in tzdata
3. **Add state information** for major US cities using the mapping table
4. **Include city aliases** for better user experience
5. **Generate comprehensive search text** for fuzzy matching
6. **Resolve country codes** to full country names for display

### Maintenance Notes:
- **US city-state mapping** may need updates when new major US timezones are added
- **City aliases** should be updated based on user feedback and common search terms
- **Country name resolution** depends on iso3166.tab staying current
- **Search text generation** logic should include all relevant searchable fields

### Testing Enhanced Data:
1. Verify New York shows "New York, New York (US)" in display
2. Confirm Mumbai search finds Asia/Kolkata
3. Check that country names appear as "United States" not "US"
4. Ensure aliases point to correct canonical timezones

