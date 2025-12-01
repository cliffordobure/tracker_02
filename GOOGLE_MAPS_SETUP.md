# Google Maps API Setup

## ✅ Google Maps Integration Complete!

The map picker has been updated to use Google Maps instead of OpenStreetMap.

## Setup Instructions

### Step 1: Get Your Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Library**
4. Search for "Maps JavaScript API" and enable it
5. Go to **APIs & Services** > **Credentials**
6. Click **Create Credentials** > **API Key**
7. Copy your API key

### Step 2: Configure the API Key

Create a `.env` file in the `frontend` folder:

**File:** `frontend/.env`

```env
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

**Important:** 
- Replace `your_actual_api_key_here` with your actual Google Maps API key
- The `VITE_` prefix is required for Vite to expose the variable to the frontend

### Step 3: Restart the Frontend Server

After creating the `.env` file, restart your frontend development server:

1. Stop the current frontend server (Ctrl+C in the terminal)
2. Start it again:
   ```bash
   cd frontend
   npm run dev
   ```

### Step 4: Test the Map Picker

1. Open the application in your browser
2. Go to Manager Dashboard > Bus Stops
3. Click "Add Stop" or "Edit Stop"
4. You should see Google Maps instead of OpenStreetMap
5. Click on the map to select a location

## Features

✅ Interactive Google Maps
✅ Click to select location
✅ Visual marker showing selected location
✅ Coordinates displayed in real-time
✅ Centered on existing location when editing

## API Key Security (Production)

For production deployment:

1. **Restrict API Key:**
   - Go to Google Cloud Console > APIs & Services > Credentials
   - Click on your API key
   - Under "Application restrictions", select "HTTP referrers (web sites)"
   - Add your production domain

2. **Limit APIs:**
   - Under "API restrictions", select "Restrict key"
   - Only enable "Maps JavaScript API"

## Troubleshooting

### Map not loading?
- Check that `.env` file exists in `frontend` folder
- Verify the API key is correct (no extra spaces)
- Make sure the API key has "Maps JavaScript API" enabled
- Check browser console for errors

### "API key not configured" message?
- Make sure the `.env` file is in the `frontend` folder
- Check that the variable name is exactly `VITE_GOOGLE_MAPS_API_KEY`
- Restart the frontend server after creating/editing `.env`

### Map loads but shows error?
- Check Google Cloud Console to ensure "Maps JavaScript API" is enabled
- Verify your API key has not exceeded quota limits
- Check that billing is enabled (required for Google Maps API)

