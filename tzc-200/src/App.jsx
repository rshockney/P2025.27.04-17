import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { Clock, ArrowDown, Share2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent } from '@/components/ui/card'
import AdSenseComponent from './AdSenseComponent'
import OldConverterButton from './OldConverterButton'
import './App.css'

function App() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [timeMode, setTimeMode] = useState('current')
  const [customDateTime, setCustomDateTime] = useState('')
  const [customDateTimePickerOpen, setCustomDateTimePickerOpen] = useState(false)
  const [fromTimezone, setFromTimezone] = useState('')
  const [toTimezone, setToTimezone] = useState('')
  const [fromSearch, setFromSearch] = useState('')
  const [toSearch, setToSearch] = useState('')
  const [fromSearchMode, setFromSearchMode] = useState('timezone') // 'timezone' or 'country'
  const [toSearchMode, setToSearchMode] = useState('timezone') // 'timezone' or 'country'
  const [fromDropdownOpen, setFromDropdownOpen] = useState(false)
  const [toDropdownOpen, setToDropdownOpen] = useState(false)
  const [timezoneData, setTimezoneData] = useState({ all: [], standard: [] })
  const [loading, setLoading] = useState(true)
  const [detectedBrowserTimezone, setDetectedBrowserTimezone] = useState('')
  
  // URL parameter handling state
  const [urlParamsPresent, setUrlParamsPresent] = useState(false)
  const [errorMessages, setErrorMessages] = useState([])
  const [initialUrlProcessed, setInitialUrlProcessed] = useState(false)

  // Ads configuration state
  const [adsConfig, setAdsConfig] = useState(null)
  const [adsError, setAdsError] = useState(null)

  // Load timezone data from external files
  useEffect(() => {
    const loadTimezoneData = async () => {
      try {
        setLoading(true)
        // Try to load enhanced timezone data first
        let response = await fetch('./assets/comprehensive-timezones.json')
        let data = await response.json()
        
        if (data.timezones && Array.isArray(data.timezones)) {
          // New structure: data.timezones is a flat array
          setTimezoneData({
            standard: data.timezones || [],
            all: data.timezones || []
          })
        } else if (data.timezones && typeof data.timezones === 'object') {
          // Old structure: data.timezones has nested arrays
          const allTimezones = [
            ...(data.timezones.standard || []),
            ...(data.timezones.major || []),
            ...(data.timezones.all || [])
          ]
          
          setTimezoneData({
            standard: data.timezones.standard || [],
            all: allTimezones
          })
        }
        setLoading(false)
      } catch (error) {
        console.error('Failed to load comprehensive timezone data:', error)
        // Fallback to basic timezone data
        setTimezoneData({
          standard: [
            { id: 'UTC', displayName: 'Coordinated Universal Time (UTC) +0:00', searchText: 'utc gmt', type: 'standard' }
          ],
          all: [
            { id: 'UTC', displayName: 'Coordinated Universal Time (UTC) +0:00', searchText: 'utc gmt', type: 'standard' },
            { id: 'America/New_York', displayName: 'New York New York - United States', city: 'New York', country: 'United States', type: 'city' },
            { id: 'Europe/London', displayName: 'London England - United Kingdom', city: 'London', country: 'United Kingdom', type: 'city' },
            { id: 'Asia/Tokyo', displayName: 'Tokyo Tokyo - Japan', city: 'Tokyo', country: 'Japan', type: 'city' }
          ]
        })
        setLoading(false)
      }
    }

    loadTimezoneData()
  }, [])

  // Auto-detect and set user's browser timezone as default From Time Zone
  useEffect(() => {
    console.log('Timezone detection useEffect running')
    console.log('timezoneData.all.length:', timezoneData.all.length)
    console.log('fromTimezone:', fromTimezone)
    console.log('initialUrlProcessed:', initialUrlProcessed)
    
    // Only run after timezone data is loaded, URL parameters are processed, and if no fromTimezone is set yet
    if (timezoneData.all.length > 0 && !fromTimezone && initialUrlProcessed) {
      try {
        // Check if fromzone parameter is present in URL
        const { fromzone, hasParams } = parseUrlParameters()
        console.log('URL parameters:', { fromzone, hasParams })
        
        // If fromzone parameter is present, don't set default timezone
        if (fromzone) {
          console.log('fromzone parameter present in URL, skipping browser timezone detection')
          return
        }
        
        // Get the user's browser timezone
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        console.log('Detected browser timezone:', browserTimezone)
        setDetectedBrowserTimezone(browserTimezone || 'Not detected')
        
        // Check if browserTimezone is empty or invalid
        if (!browserTimezone || browserTimezone.trim() === '') {
          console.log('Browser timezone is empty, defaulting to Etc/GMT')
          // First try Etc/GMT specifically, then GMT, then America/New_York as last resort
          const gmtTimezone = timezoneData.all.find(tz => tz.id === 'Etc/GMT') ||
                             timezoneData.all.find(tz => tz.id === 'GMT') ||
                             timezoneData.all.find(tz => tz.id === 'America/New_York')
          
          if (gmtTimezone) {
            console.log('Found GMT timezone:', gmtTimezone.id)
            setFromTimezone(gmtTimezone.id)
            setFromSearch(gmtTimezone.displayName || gmtTimezone.id)
            return
          } else {
            console.log('GMT timezone not found in data')
          }
        }
        
        // Find this timezone in our data
        const matchingTimezone = timezoneData.all.find(tz => tz.id === browserTimezone)
        
        if (matchingTimezone) {
          console.log('Setting default fromTimezone to:', matchingTimezone.id)
          setFromTimezone(matchingTimezone.id)
          setFromSearch(matchingTimezone.displayName || matchingTimezone.id)
        } else {
          console.log('Browser timezone not found in data, defaulting to Etc/GMT')
          // First try Etc/GMT specifically, then GMT, then America/New_York as last resort
          const gmtTimezone = timezoneData.all.find(tz => tz.id === 'Etc/GMT') ||
                             timezoneData.all.find(tz => tz.id === 'GMT') ||
                             timezoneData.all.find(tz => tz.id === 'America/New_York')
          
          if (gmtTimezone) {
            console.log('Found fallback timezone:', gmtTimezone.id)
            setFromTimezone(gmtTimezone.id)
            setFromSearch(gmtTimezone.displayName || gmtTimezone.id)
          } else {
            console.log('No fallback timezone found')
          }
        }
      } catch (error) {
        console.error('Error detecting browser timezone, defaulting to Etc/GMT:', error)
        setDetectedBrowserTimezone('Error: ' + error.message)
        // Final fallback to Etc/GMT in case of any errors
        const gmtTimezone = timezoneData.all.find(tz => tz.id === 'Etc/GMT') ||
                           timezoneData.all.find(tz => tz.id === 'GMT') ||
                           timezoneData.all.find(tz => tz.id === 'America/New_York')
        
        if (gmtTimezone) {
          console.log('Found error fallback timezone:', gmtTimezone.id)
          setFromTimezone(gmtTimezone.id)
          setFromSearch(gmtTimezone.displayName || gmtTimezone.id)
        } else {
          console.log('No error fallback timezone found')
        }
      }
    } else {
      console.log('Timezone detection skipped: data not loaded, fromTimezone already set, or URL parameters not processed yet')
    }
  }, [timezoneData.all, fromTimezone, initialUrlProcessed])

  // Load ads configuration
  useEffect(() => {
    const loadAdsConfig = async () => {
      try {
        // Add cache-busting parameter to ensure fresh data
        const cacheBuster = new Date().getTime()
        const response = await fetch(`./assets/config.json?v=${cacheBuster}`)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        const config = await response.json()
        
        // Load AdSense code from text files for each ad unit
        if (config.adUnits) {
          for (const adUnit of config.adUnits) {
            if (adUnit.adsenseCodeFile) {
              try {
                const codeResponse = await fetch(`./assets/${adUnit.adsenseCodeFile}?v=${cacheBuster}`)
                if (codeResponse.ok) {
                  adUnit.adsenseCode = await codeResponse.text()
                } else {
                  console.warn(`Failed to load AdSense code from ${adUnit.adsenseCodeFile}`)
                }
              } catch (error) {
                console.warn(`Error loading AdSense code from ${adUnit.adsenseCodeFile}:`, error)
              }
            }
          }
        }
        
        console.log('Config loaded successfully:', config)
        setAdsConfig(config)
      } catch (error) {
        console.error('Failed to load ads configuration:', error)
        setAdsError(error.message)
      }
    }

    loadAdsConfig()
  }, [])

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Force update of current time display when fromTimezone changes
  useEffect(() => {
    // This will trigger a re-render with the new fromTimezone
    if (fromTimezone) {
      // Force a re-render by creating a new Date object
      // This ensures the current time display updates with the new timezone
      const forceUpdate = () => {
        setCurrentTime(new Date());
      };
      
      // Immediately update
      forceUpdate();
      
      // Also set up a timer to update every second while this timezone is selected
      const timer = setInterval(forceUpdate, 1000);
      
      // Clean up the timer when fromTimezone changes or component unmounts
      return () => clearInterval(timer);
    }
  }, [fromTimezone]);
  // Auto-populate custom date/time with current time when switching to custom mode
  useEffect(() => {
    if (timeMode === 'custom') {
      // Format current time to match datetime-local input format
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`
      setCustomDateTime(formattedDateTime)
    }
  }, [timeMode])

  // Process URL parameters when timezone data is loaded
  useEffect(() => {
    if (!loading && timezoneData.all.length > 0) {
      processUrlParameters()
    }
  }, [loading, timezoneData.all.length, initialUrlProcessed])

  // Update URL when timezones change (if URL params were originally present)
  useEffect(() => {
    if (initialUrlProcessed && urlParamsPresent) {
      updateUrlParameters()
    }
  }, [fromTimezone, toTimezone, initialUrlProcessed, urlParamsPresent])
  // Force conversion update when custom date/time changes
  useEffect(() => {
    // This useEffect ensures that conversion results update immediately
    // when customDateTime changes, triggering a re-render
    if (timeMode === 'custom' && customDateTime) {
      console.log('Custom date/time useEffect triggered:', customDateTime);
      
      // Create a dummy state update to force a re-render
      // This is especially important for AM/PM changes which might not be
      // detected as value changes in the input element
      const dummyUpdate = () => {
        // Use a functional update to ensure we're not actually changing the value
        // This just forces React to re-render the component
        setCustomDateTime(current => current);
      };
      
      // Schedule the dummy update for the next tick
      // This ensures that any pending state updates complete first
      setTimeout(dummyUpdate, 0);
    }
  }, [customDateTime, timeMode]);

  // Handle clicking outside the calendar picker to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customDateTimePickerOpen) {
        // Check if the click is outside the picker dropdown
        const pickerElement = document.querySelector('.calendar-picker-dropdown');
        const calendarButton = document.querySelector('.calendar-button');
        
        if (pickerElement && !pickerElement.contains(event.target) && 
            calendarButton && !calendarButton.contains(event.target)) {
          setCustomDateTimePickerOpen(false);
        }
      }
    };

    if (customDateTimePickerOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [customDateTimePickerOpen]);

  // Helper function to check if an ad should be displayed
  const shouldDisplayAd = (adUnitId) => {
    if (!adsConfig) return false
    
    // Check global ads enabled setting
    if (adsConfig.globalSettings && adsConfig.globalSettings.enabled === false) {
      return false
    }
    
    // Find the specific ad unit
    const adUnit = adsConfig.adUnits?.find(unit => unit.id === adUnitId)
    if (!adUnit) return false
    
    // Check if this specific ad unit is enabled
    return adUnit.enabled === true
  }

  // REAL-TIME DYNAMIC SEARCH - Updates with EVERY keystroke
  const getFilteredTimezones = (search) => {
    // Always use the complete timezone database
    const allTimezones = timezoneData.all || []
    
    // If no search term, return empty array to show clean interface
    if (!search || search.trim() === '') {
      return []
    }
    
    // EXHAUSTIVE and COMPREHENSIVE search of ALL fields in the JSON
    const searchLower = search.toLowerCase().trim()
    const allMatches = []
    
    // Search through every timezone in the database
    allTimezones.forEach(tz => {
      const matchReasons = []
      const sortingMatchReasons = [] // Only for actual data fields (excluding displayName and searchText)
      let hasMatch = false
      
      // Search actual data fields - these COUNT toward match count for sorting
      if (tz.id?.toLowerCase().includes(searchLower)) {
        matchReasons.push(`ID: ${tz.id}`)
        sortingMatchReasons.push(`ID: ${tz.id}`)
        hasMatch = true
      }
      if (tz.name?.toLowerCase().includes(searchLower)) {
        matchReasons.push(`Name: ${tz.name}`)
        sortingMatchReasons.push(`Name: ${tz.name}`)
        hasMatch = true
      }
      if (tz.city?.toLowerCase().includes(searchLower)) {
        matchReasons.push(`City: ${tz.city}`)
        sortingMatchReasons.push(`City: ${tz.city}`)
        hasMatch = true
      }
      if (tz.state?.toLowerCase().includes(searchLower)) {
        matchReasons.push(`State: ${tz.state}`)
        sortingMatchReasons.push(`State: ${tz.state}`)
        hasMatch = true
      }
      if (tz.country?.toLowerCase().includes(searchLower)) {
        matchReasons.push(`Country: ${tz.country}`)
        sortingMatchReasons.push(`Country: ${tz.country}`)
        hasMatch = true
      }
      if (tz.countryCode?.toLowerCase().includes(searchLower)) {
        matchReasons.push(`Country Code: ${tz.countryCode}`)
        sortingMatchReasons.push(`Country Code: ${tz.countryCode}`)
        hasMatch = true
      }
      if (tz.region?.toLowerCase().includes(searchLower)) {
        matchReasons.push(`Region: ${tz.region}`)
        sortingMatchReasons.push(`Region: ${tz.region}`)
        hasMatch = true
      }
      if (tz.type?.toLowerCase().includes(searchLower)) {
        matchReasons.push(`Type: ${tz.type}`)
        sortingMatchReasons.push(`Type: ${tz.type}`)
        hasMatch = true
      }
      if (tz.offset?.toLowerCase().includes(searchLower)) {
        matchReasons.push(`Offset: ${tz.offset}`)
        sortingMatchReasons.push(`Offset: ${tz.offset}`)
        hasMatch = true
      }
      if (tz.abbreviation?.toLowerCase().includes(searchLower)) {
        matchReasons.push(`Abbreviation: ${tz.abbreviation}`)
        sortingMatchReasons.push(`Abbreviation: ${tz.abbreviation}`)
        hasMatch = true
      }
      
      // Search displayName and searchText for FILTERING only (do NOT count toward match count)
      if (tz.displayName?.toLowerCase().includes(searchLower)) {
        matchReasons.push(`Display Name`)
        hasMatch = true
        // NOTE: displayName match does NOT add to sortingMatchReasons
      }
      if (tz.searchText?.toLowerCase().includes(searchLower)) {
        matchReasons.push(`Search Text`)
        hasMatch = true
        // NOTE: searchText match does NOT add to sortingMatchReasons
      }
      
      // Search countries array for FILTERING only (do NOT count toward match count)
      if (tz.countries && Array.isArray(tz.countries)) {
        for (const country of tz.countries) {
          if (country.toLowerCase().includes(searchLower)) {
            matchReasons.push(`Country Code: ${country}`)
            hasMatch = true
            break
          }
        }
      }
      
      // Search countryNames array for FILTERING only (do NOT count toward match count)
      if (tz.countryNames && Array.isArray(tz.countryNames)) {
        for (const countryName of tz.countryNames) {
          if (countryName.toLowerCase().includes(searchLower)) {
            matchReasons.push(`Country Name: ${countryName}`)
            hasMatch = true
            break
          }
        }
      }
      
      if (hasMatch) {
        allMatches.push({
          ...tz,
          matchReason: `Match: ${matchReasons.join(', ')}`,
          matchCount: sortingMatchReasons.length // Only count actual data field matches for sorting
        })
      }
    })
    
    // Sort by match count (descending) then by display name
    // Higher match counts appear first (e.g., 7 matches before 2 matches)
    return allMatches.sort((a, b) => {
      if (b.matchCount !== a.matchCount) {
        return b.matchCount - a.matchCount
      }
      return a.displayName.localeCompare(b.displayName)
    })
  }

  // Get timezone info for display with proper country resolution
  const getTimezoneInfo = (timezoneId) => {
    // Search through ALL timezone data to find the matching timezone
    const allTimezones = [...(timezoneData.standard || []), ...timezoneData.all]
    const found = allTimezones.find(tz => tz.id === timezoneId)
    
    if (found) {
      // Convert countries array to readable country code string
      let countryCodeDisplay = 'Unknown'
      let countryNameDisplay = 'Unknown'
      
      if (found.countries && found.countries.length > 0) {
        // Show the first country code
        countryCodeDisplay = found.countries[0]
        // If multiple countries, show count
        if (found.countries.length > 1) {
          countryCodeDisplay += ` (+${found.countries.length - 1} more)`
        }
        
        // Show the first country name
        if (found.countryNames && found.countryNames.length > 0) {
          countryNameDisplay = found.countryNames[0]
          // If multiple countries, show count
          if (found.countryNames.length > 1) {
            countryNameDisplay += ` (+${found.countryNames.length - 1} more)`
          }
        }
      }
      
      return {
        ...found,
        // Provide both country code and country name
        countryCode: countryCodeDisplay,
        country: countryNameDisplay,
        displayName: found.displayName || `${found.city || found.name} ${found.state ? found.state + ' - ' : ''}${countryNameDisplay}`
      }
    }
    
    // Enhanced fallback with better parsing
    const parts = timezoneId.split('/')
    const city = parts[parts.length - 1]?.replace(/_/g, ' ') || timezoneId
    const region = parts[0] || 'Unknown'
    
    return {
      id: timezoneId,
      displayName: `${city} (${region})`,
      city: city,
      country: 'Unknown',
      region: region
    }
  }

  // Format time for display (original format for conversion results)
  const formatTime = (date, timezone) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      }).format(date)
    } catch (error) {
      return date.toLocaleString()
    }
  }

  // Format time for date/time boxes (standardized format: DOW Month DD YYYY HH:MM:SS AM/PM)
  const formatTimeForBoxes = (date, timezone) => {
    try {
      // Create a date in the specified timezone
      const dateInTimezone = new Date(date.toLocaleString("en-US", {timeZone: timezone}))
      
      // Get components
      const dayOfWeek = date.toLocaleDateString('en-US', { 
        timeZone: timezone, 
        weekday: 'short' 
      })
      const month = date.toLocaleDateString('en-US', { 
        timeZone: timezone, 
        month: 'long' 
      })
      const day = date.toLocaleDateString('en-US', { 
        timeZone: timezone, 
        day: '2-digit' 
      })
      const year = date.toLocaleDateString('en-US', { 
        timeZone: timezone, 
        year: 'numeric' 
      })
      const time = date.toLocaleTimeString('en-US', { 
        timeZone: timezone, 
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
      
      return `${dayOfWeek} ${month} ${day} ${year} ${time}`
    } catch (error) {
      // Fallback to local time formatting
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' })
      const month = date.toLocaleDateString('en-US', { month: 'long' })
      const day = date.toLocaleDateString('en-US', { day: '2-digit' })
      const year = date.toLocaleDateString('en-US', { year: 'numeric' })
      const time = date.toLocaleTimeString('en-US', { 
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
      
      return `${dayOfWeek} ${month} ${day} ${year} ${time}`
    }
  }

  // Handle custom date/time input changes with immediate conversion update
  const handleCustomDateTimeChange = (value) => {
    console.log('Custom date/time changed to:', value);
    
    // Store the previous value for comparison
    const prevValue = customDateTime;
    
    // Update the state with the new value
    setCustomDateTime(value);
    
    // Log for debugging
    if (prevValue !== value) {
      console.log('Value changed from', prevValue, 'to', value);
    } else {
      console.log('Value unchanged, but event triggered');
    }
    
    // The state change will automatically trigger a re-render and update conversions
    // This ensures immediate feedback for both typing and picker selections
  }

  // Handle opening the custom date/time picker
  const handleOpenCustomPicker = () => {
    console.log('Calendar button clicked, opening picker');
    flushSync(() => {
      setCustomDateTimePickerOpen(true);
    });
    console.log('Picker state updated with flushSync');
  }

  // Handle closing the custom date/time picker
  const handleCloseCustomPicker = () => {
    setCustomDateTimePickerOpen(false)
  }

  // Handle Clear button in picker
  const handleClearCustomDateTime = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`
    setCustomDateTime(formattedDateTime)
  }

  // Handle Today button in picker
  const handleTodayCustomDateTime = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    // Keep current time from existing custom date/time if it exists
    let hours = String(now.getHours()).padStart(2, '0')
    let minutes = String(now.getMinutes()).padStart(2, '0')
    
    if (customDateTime) {
      const existingDate = new Date(customDateTime)
      if (!isNaN(existingDate.getTime())) {
        hours = String(existingDate.getHours()).padStart(2, '0')
        minutes = String(existingDate.getMinutes()).padStart(2, '0')
      }
    }
    
    const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`
    setCustomDateTime(formattedDateTime)
  }

  // Handle Done button in picker
  const handleDoneCustomDateTime = () => {
    setCustomDateTimePickerOpen(false)
    // The customDateTime state is already updated by the input onChange
  }

  // Get the time to convert
  const getTimeToConvert = () => {
    if (timeMode === 'current') {
      return currentTime
    } else {
      return customDateTime ? new Date(customDateTime) : currentTime
    }
  }

  // Convert time between timezones
  const convertTime = (sourceTime, fromTz, toTz) => {
    try {
      // Create a date in the source timezone
      const sourceDate = new Date(sourceTime)
      return sourceDate
    } catch (error) {
      return new Date()
    }
  }

  const timeToConvert = getTimeToConvert()
  const convertedTime = convertTime(timeToConvert, fromTimezone, toTimezone)
  const fromInfo = getTimezoneInfo(fromTimezone)
  const toInfo = getTimezoneInfo(toTimezone)

  // Format timezone display for search results: City, State, Country Name (Country Code)
  const formatTimezoneDisplay = (tz) => {
    const parts = []
    
    // Always add city if available
    if (tz.city) {
      parts.push(tz.city)
    }
    
    // Always add state if available
    if (tz.state) {
      parts.push(tz.state)
    }
    
    // Add country name only if it's different from the state
    if (tz.countryNames && tz.countryNames.length > 0) {
      const firstCountryName = tz.countryNames[0]
      if (tz.state !== firstCountryName) {
        parts.push(firstCountryName)
      }
    }
    
    // Create the main display string
    let displayString = parts.join(', ')
    
    // Add country code in parentheses
    if (tz.countries && tz.countries.length > 0) {
      displayString += ` (${tz.countries[0]})`
    }
    
    return displayString
  }

  // URL Parameter Handling Functions
  const parseUrlParameters = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const fromzoneParam = urlParams.get('fromzone')
    const tozoneParam = urlParams.get('tozone')
    
    return {
      fromzone: fromzoneParam,
      tozone: tozoneParam,
      hasParams: !!(fromzoneParam || tozoneParam)
    }
  }

  const validateTimezone = (timezoneId) => {
    if (!timezoneId || !timezoneData.all) return { isValid: false, timezone: null }
    
    // Check if timezone exists in our data (exact match, case-sensitive)
    const found = timezoneData.all.find(tz => 
      tz.id === timezoneId || 
      (tz.canonical && tz.canonical === timezoneId)
    )
    
    return {
      isValid: !!found,
      timezone: found || null
    }
  }

  const processUrlParameters = async () => {
    if (initialUrlProcessed || !timezoneData.all.length) return
    
    const { fromzone, tozone, hasParams } = parseUrlParameters()
    
    if (!hasParams) {
      setInitialUrlProcessed(true)
      return
    }
    
    setUrlParamsPresent(true)
    const newErrors = []
    
    // Process fromzone parameter
    if (fromzone) {
      const fromValidation = validateTimezone(fromzone)
      if (fromValidation.isValid) {
        setFromTimezone(fromValidation.timezone.canonical || fromValidation.timezone.id)
      } else {
        // Invalid timezone - perform search and show error
        setFromSearch(fromzone)
        setFromDropdownOpen(true)
        newErrors.push(`Timezone ${fromzone} not found.`)
      }
    }
    
    // Process tozone parameter
    if (tozone) {
      const toValidation = validateTimezone(tozone)
      if (toValidation.isValid) {
        setToTimezone(toValidation.timezone.canonical || toValidation.timezone.id)
      } else {
        // Invalid timezone - perform search and show error
        setToSearch(tozone)
        setToDropdownOpen(true)
        newErrors.push(`Timezone ${tozone} not found.`)
      }
    }
    
    setErrorMessages(newErrors)
    setInitialUrlProcessed(true)
  }

  const updateUrlParameters = () => {
    if (!urlParamsPresent) return // Only update URL if params were originally present
    
    const url = new URL(window.location)
    
    if (fromTimezone) {
      url.searchParams.set('fromzone', fromTimezone)
    } else {
      url.searchParams.delete('fromzone')
    }
    
    if (toTimezone) {
      url.searchParams.set('tozone', toTimezone)
    } else {
      url.searchParams.delete('tozone')
    }
    
    window.history.replaceState({}, '', url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading timezone data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Main Content with Sidebar Layout */}
        <div className="main-content-with-sidebar">
          {/* Main Content Area */}
          <div className="main-content-area">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="h-8 w-8 text-red-800" />
            <h1 className="text-3xl font-bold text-gray-900">Time Zone Converter</h1>
          </div>
          <p className="text-gray-600">"What time is it in __________?"</p>
        </div>

        {/* Old Converter Button */}
        <OldConverterButton 
          config={adsConfig} 
          className="mb-2 flex justify-end"
        />

        {/* Main Converter Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold">Convert Time Zones</h2>
            </div>
            <p className="text-gray-600 mb-6">Search and select source and target time zones, then choose your date and time</p>

            {/* Time Selection */}
            <div className="space-y-4 mb-6">
              {/* Radio Group (hidden but maintains state) */}
              <div className="hidden">
                <RadioGroup value={timeMode} onValueChange={setTimeMode}>
                  <RadioGroupItem value="current" id="current" />
                  <RadioGroupItem value="custom" id="custom" />
                </RadioGroup>
              </div>

              {/* Time Display Boxes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Time - Always Visible */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-base font-medium flex items-center">
                      <div className="flex items-center space-x-2 mr-2">
                        <button 
                          className={`w-4 h-4 rounded-full border ${timeMode === 'current' ? 'bg-black border-black' : 'border-gray-400'} flex items-center justify-center`}
                          onClick={() => setTimeMode('current')}
                        >
                          {timeMode === 'current' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                        </button>
                      </div>
                      Current Date/Time
                    </Label>
                  </div>
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg h-16 flex items-center">
                    <div className="text-base font-mono">
                      {fromTimezone 
                        ? formatTimeForBoxes(currentTime, fromTimezone)
                        : formatTimeForBoxes(currentTime, Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')
                      }
                    </div>
                  </div>
                </div>

                {/* Custom Time - Always Visible but Grayed Out When Not Selected */}
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-base font-medium flex items-center">
                      <div className="flex items-center space-x-2 mr-2">
                        <button 
                          className={`w-4 h-4 rounded-full border ${timeMode === 'custom' ? 'bg-black border-black' : 'border-gray-400'} flex items-center justify-center`}
                          onClick={() => setTimeMode('custom')}
                        >
                          {timeMode === 'custom' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                        </button>
                      </div>
                      Custom Date/Time
                    </Label>
                  </div>
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg h-16 flex items-center justify-between">
                    <div className={`text-base font-mono ${timeMode !== 'custom' ? 'text-gray-300' : 'text-gray-900'}`}>
                      {customDateTime 
                        ? formatTimeForBoxes(new Date(customDateTime), fromTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')
                        : formatTimeForBoxes(currentTime, fromTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')
                      }
                    </div>
                    {timeMode === 'custom' && (
                      <button
                        onClick={handleOpenCustomPicker}
                        className="ml-2 p-2 h-8 w-8 calendar-button bg-transparent hover:bg-gray-100 rounded border-0 cursor-pointer flex items-center justify-center"
                        type="button"
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Custom Date/Time Picker Dropdown */}
                  {customDateTimePickerOpen && (
                    <div 
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-gray-200 shadow-lg p-4 z-50 calendar-picker-dropdown" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CalendarComponent 
                        selectedDate={customDateTime}
                        onDateSelect={handleCustomDateTimeChange}
                        onClose={handleDoneCustomDateTime}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Container for Timezone Selection and Results */}
            <div className="space-y-6">
              {/* Two-Column Layout for From and To Timezone Selection */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - From Timezone */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-200 border border-green-300 rounded-full"></div>
                      From Time Zone
                    </Label>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          placeholder="Search for timezone..."
                          value={fromSearch}
                          onChange={(e) => {
                            const newValue = e.target.value
                            // SHARED SEARCH HANDLER - Prevent duplicate execution
                            if (newValue !== fromSearch) {
                              setFromSearch(newValue)
                              if (newValue.length > 0) {
                                setFromDropdownOpen(true)
                              } else {
                                setFromDropdownOpen(false)
                              }
                            }
                          }}
                          onKeyDown={(e) => {
                            const newValue = e.target.value
                            // SHARED SEARCH HANDLER - Only execute if value actually changed
                            if (newValue !== fromSearch) {
                              setFromSearch(newValue)
                              if (newValue.length > 0) {
                                setFromDropdownOpen(true)
                              } else {
                                setFromDropdownOpen(false)
                              }
                            }
                          }}
                          onFocus={() => {
                            if (fromSearch.length > 0) {
                              setFromDropdownOpen(true)
                            }
                          }}
                          onBlur={() => setTimeout(() => setFromDropdownOpen(false), 200)}
                          className="flex-1"
                        />
                        {/* REAL-TIME DYNAMIC DROPDOWN - Updates with every keystroke */}
                        {fromDropdownOpen && fromSearch.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                            {getFilteredTimezones(fromSearch).map((tz, index) => (
                              <div
                                key={`${tz.id}-${tz.city || tz.name}-${index}`}
                                className="px-3 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 text-center"
                                onClick={() => {
                                  // Use canonical name if available, otherwise use the timezone ID
                                  const timezoneToUse = tz.canonical || tz.id
                                  setFromTimezone(timezoneToUse)
                                  setFromSearch('')
                                  setFromDropdownOpen(false)
                                  // Clear error messages when a valid timezone is selected
                                  setErrorMessages(prev => prev.filter(msg => !msg.includes(fromSearch)))
                                }}
                              >
                                <div className="font-medium text-gray-900 text-base">
                                  {tz.canonical || tz.id}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {formatTimezoneDisplay(tz)}
                                </div>
                                {tz.matchReason && (
                                  <div className="text-xs text-blue-600 mt-1">
                                    {tz.matchReason}
                                  </div>
                                )}
                              </div>
                            ))}
                            {getFilteredTimezones(fromSearch).length === 0 && (
                              <div className="px-3 py-2 text-sm text-gray-500">No matching timezones found</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timezone Info Display */}
                    {fromInfo.id && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md text-center">
                        <div className="text-xl font-semibold text-gray-900 mb-2">
                          {fromInfo.canonical || fromInfo.id}
                        </div>
                        <div className="text-base text-gray-600">
                          {formatTimezoneDisplay(fromInfo)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - To Timezone */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-200 border border-orange-300 rounded-full"></div>
                      To Time Zone
                    </Label>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          placeholder="Search for timezone..."
                          value={toSearch}
                          onChange={(e) => {
                            const newValue = e.target.value
                            // SHARED SEARCH HANDLER - Prevent duplicate execution
                            if (newValue !== toSearch) {
                              setToSearch(newValue)
                              if (newValue.length > 0) {
                                setToDropdownOpen(true)
                              } else {
                                setToDropdownOpen(false)
                              }
                            }
                          }}
                          onKeyDown={(e) => {
                            const newValue = e.target.value
                            // SHARED SEARCH HANDLER - Only execute if value actually changed
                            if (newValue !== toSearch) {
                              setToSearch(newValue)
                              if (newValue.length > 0) {
                                setToDropdownOpen(true)
                              } else {
                                setToDropdownOpen(false)
                              }
                            }
                          }}
                          onFocus={() => {
                            if (toSearch.length > 0) {
                              setToDropdownOpen(true)
                            }
                          }}
                          onBlur={() => setTimeout(() => setToDropdownOpen(false), 200)}
                          className="flex-1"
                        />
                        {/* REAL-TIME DYNAMIC DROPDOWN - Updates with every keystroke */}
                        {toDropdownOpen && toSearch.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                            {getFilteredTimezones(toSearch).map((tz, index) => (
                              <div
                                key={`${tz.id}-${tz.city || tz.name}-${index}`}
                                className="px-3 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 text-center"
                                onClick={() => {
                                  // Use canonical name if available, otherwise use the timezone ID
                                  const timezoneToUse = tz.canonical || tz.id
                                  setToTimezone(timezoneToUse)
                                  setToSearch('')
                                  setToDropdownOpen(false)
                                  // Clear error messages when a valid timezone is selected
                                  setErrorMessages(prev => prev.filter(msg => !msg.includes(toSearch)))
                                }}
                              >
                                <div className="font-medium text-gray-900 text-base">
                                  {tz.canonical || tz.id}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {formatTimezoneDisplay(tz)}
                                </div>
                                {tz.matchReason && (
                                  <div className="text-xs text-blue-600 mt-1">
                                    {tz.matchReason}
                                  </div>
                                )}
                              </div>
                            ))}
                            {getFilteredTimezones(toSearch).length === 0 && (
                              <div className="px-3 py-2 text-sm text-gray-500">No matching timezones found</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timezone Info Display */}
                    {toInfo.id && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md text-center">
                        <div className="text-xl font-semibold text-gray-900 mb-2">
                          {toInfo.canonical || toInfo.id}
                        </div>
                        <div className="text-base text-gray-600">
                          {formatTimezoneDisplay(toInfo)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Conversion Results */}
            <div className="mt-8">
              {(() => {
                // Display error messages at the top in red
                const errorDisplay = errorMessages.length > 0 ? (
                  <div className="flex justify-center mb-4">
                    <div className="w-full max-w-3xl p-4 bg-red-50 border-2 border-red-200 rounded-lg shadow-sm">
                      <div className="text-center space-y-2">
                        {errorMessages.map((error, index) => (
                          <div key={index} className="text-red-600 font-medium">
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null;

                // Scenario 1: No timezones selected - no conversion results
                if (!fromTimezone && !toTimezone) {
                  return errorDisplay;
                }
                
                // Scenario 2: Only from timezone exists
                if (fromTimezone && !toTimezone) {
                  return (
                    <div>
                      {errorDisplay}
                      <div className="flex justify-center">
                        <div className="w-full max-w-3xl p-8 bg-blue-50 border-2 border-blue-200 rounded-lg shadow-sm">
                          <div className="text-center space-y-3">
                            <div className="text-base font-semibold text-gray-900">
                              It is
                            </div>
                            <div className="text-base font-mono text-gray-800 whitespace-nowrap">
                              {formatTime(timeToConvert, fromTimezone)}
                            </div>
                            <div className="text-lg text-gray-600">
                              in <span className="font-bold">{fromTimezone}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                // Scenario 3: Only to timezone exists
                if (!fromTimezone && toTimezone) {
                  return (
                    <div>
                      {errorDisplay}
                      <div className="flex justify-center">
                        <div className="w-full max-w-3xl p-8 bg-blue-50 border-2 border-blue-200 rounded-lg shadow-sm">
                          <div className="text-center space-y-3">
                            <div className="text-base font-semibold text-gray-900">
                              It is
                            </div>
                            <div className="text-base font-mono text-gray-800 whitespace-nowrap">
                              {formatTime(timeToConvert, toTimezone)}
                            </div>
                            <div className="text-lg text-gray-600">
                              in <span className="font-bold">{toTimezone}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                // Scenario 5: Both timezones exist and are the same - display as single timezone
                if (fromTimezone && toTimezone && fromTimezone === toTimezone) {
                  return (
                    <div>
                      {errorDisplay}
                      <div className="flex justify-center">
                        <div className="w-full max-w-3xl p-8 bg-blue-50 border-2 border-blue-200 rounded-lg shadow-sm">
                          <div className="text-center space-y-3">
                            <div className="text-base font-semibold text-gray-900">
                              It is
                            </div>
                            <div className="text-base font-mono text-gray-800 whitespace-nowrap">
                              {formatTime(timeToConvert, fromTimezone)}
                            </div>
                            <div className="text-lg text-gray-600">
                              in <span className="font-bold">{fromTimezone}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                // Scenario 4: Both timezones exist and are different - show conversion
                if (fromTimezone && toTimezone && fromTimezone !== toTimezone) {
                  return (
                    <div>
                      {errorDisplay}
                      <div className="flex justify-center">
                        <div className="w-full max-w-3xl p-8 bg-blue-50 border-2 border-blue-200 rounded-lg shadow-sm">
                          <div className="text-center space-y-3">
                            <div className="text-base font-mono text-gray-800 whitespace-nowrap">
                              {formatTime(timeToConvert, fromTimezone)}
                            </div>
                            <div className="text-lg text-gray-600">
                              in <span className="font-bold">{fromTimezone}</span>
                            </div>
                            <div className="text-base font-semibold text-gray-900 my-4">
                              Converts to
                            </div>
                            <div className="text-base font-mono text-gray-800 whitespace-nowrap">
                              {formatTime(convertedTime, toTimezone)}
                            </div>
                            <div className="text-lg text-gray-600">
                              in <span className="font-bold">{toTimezone}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                return errorDisplay;
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Footer Ad Container - visible on desktop */}
        {shouldDisplayAd('footer_ad') && (
          <div className="footer-ad-container">
            <AdSenseComponent 
              adUnit={adsConfig?.adUnits?.find(unit => unit.id === 'footer_ad')}
            />
          </div>
        )}

        {/* Footer Info */}
        <div className="text-center text-sm text-gray-500 space-y-1">
          <p>Enhanced timezone data with real-time intelligent search capabilities</p>
          <p>Showing {timezoneData.all.length} total timezones with comprehensive search functionality</p>
          <p>Smart search by city, country, timezone abbreviation, or UTC offset</p>
          <p className="mt-3 text-gray-600">Copyright timezoneconverter.com. All rights reserved.</p>
        </div>

        {/* Version Info */}
        <div className="mt-4 text-center text-xs text-gray-400">
          <p>Version: 2025.27.04</p>
        </div>
          </div>

          {/* Sidebar Ad Container - visible only on large desktop */}
          {shouldDisplayAd('sidebar_ad') && (
            <div className="sidebar-ad-container">
              <AdSenseComponent 
                adUnit={adsConfig?.adUnits?.find(unit => unit.id === 'sidebar_ad')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Calendar Component - Compact inline picker with improved layout
const CalendarComponent = ({ selectedDate, onDateSelect, onClose }) => {
  // Parse the selected date or use current date
  const parsedDate = selectedDate ? new Date(selectedDate) : new Date();
  
  // State for the calendar
  const [currentMonth, setCurrentMonth] = useState(parsedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(parsedDate.getFullYear());
  const [selectedDateObj, setSelectedDateObj] = useState(parsedDate);
  
  // State for time selection
  const [selectedHour, setSelectedHour] = useState(parsedDate.getHours());
  const [selectedMinute, setSelectedMinute] = useState(parsedDate.getMinutes());
  const [is24Hour, setIs24Hour] = useState(false);
  
  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Day names
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  
  // Generate year options (current year ± 10 years)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 10; year <= currentYear + 10; year++) {
      years.push(year);
    }
    return years;
  };
  
  // Generate calendar days
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === currentMonth;
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = date.toDateString() === selectedDateObj.toDateString();
      
      days.push({
        date: date,
        day: date.getDate(),
        isCurrentMonth,
        isToday,
        isSelected
      });
    }
    
    return days;
  };
  
  // Handle date click
  const handleDateClick = (date) => {
    const newDate = new Date(date);
    newDate.setHours(selectedHour);
    newDate.setMinutes(selectedMinute);
    setSelectedDateObj(newDate);
  };
  
  // Handle month navigation
  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };
  
  // Handle month dropdown change
  const handleMonthChange = (month) => {
    const newMonth = parseInt(month);
    const currentDay = selectedDateObj.getDate();
    
    // Create a new date with the new month
    const newDate = new Date(currentYear, newMonth, 1);
    
    // Get the last day of the new month
    const lastDayOfMonth = new Date(currentYear, newMonth + 1, 0).getDate();
    
    // Use the current day if it exists in the new month, otherwise use the last day of the month
    const dayToUse = currentDay <= lastDayOfMonth ? currentDay : lastDayOfMonth;
    
    newDate.setDate(dayToUse);
    newDate.setHours(selectedHour);
    newDate.setMinutes(selectedMinute);
    
    setCurrentMonth(newMonth);
    setSelectedDateObj(newDate);
  };
  
  // Handle year dropdown change
  const handleYearChange = (year) => {
    const newYear = parseInt(year);
    const currentDay = selectedDateObj.getDate();
    
    // Create a new date with the new year
    const newDate = new Date(newYear, currentMonth, 1);
    
    // Get the last day of the current month in the new year
    const lastDayOfMonth = new Date(newYear, currentMonth + 1, 0).getDate();
    
    // Use the current day if it exists in the new month/year, otherwise use the last day of the month
    const dayToUse = currentDay <= lastDayOfMonth ? currentDay : lastDayOfMonth;
    
    newDate.setDate(dayToUse);
    newDate.setHours(selectedHour);
    newDate.setMinutes(selectedMinute);
    
    setCurrentYear(newYear);
    setSelectedDateObj(newDate);
  };
  
  // Handle time change
  const handleTimeChange = (type, value) => {
    const newDate = new Date(selectedDateObj);
    
    if (type === 'hour') {
      setSelectedHour(value);
      newDate.setHours(value);
    } else if (type === 'minute') {
      setSelectedMinute(value);
      newDate.setMinutes(value);
    }
    
    setSelectedDateObj(newDate);
  };
  
  // Handle Done button
  const handleDone = () => {
    const finalDate = new Date(selectedDateObj);
    finalDate.setHours(selectedHour);
    finalDate.setMinutes(selectedMinute);
    onDateSelect(finalDate);
    onClose();
  };
  
  // Handle Clear button
  const handleClear = () => {
    const now = new Date();
    setSelectedDateObj(now);
    setSelectedHour(now.getHours());
    setSelectedMinute(now.getMinutes());
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
  };
  
  // Handle Today button
  const handleToday = () => {
    const now = new Date();
    setSelectedDateObj(now);
    setSelectedHour(now.getHours());
    setSelectedMinute(now.getMinutes());
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
  };
  
  // Format time display
  const formatTimeDisplay = () => {
    if (is24Hour) {
      return `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
    } else {
      const displayHour = selectedHour === 0 ? 12 : selectedHour > 12 ? selectedHour - 12 : selectedHour;
      const ampm = selectedHour >= 12 ? 'PM' : 'AM';
      return `${displayHour}:${String(selectedMinute).padStart(2, '0')} ${ampm}`;
    }
  };
  
  const calendarDays = generateCalendarDays();
  const yearOptions = generateYearOptions();
  
  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 w-80">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Select Date & Time</h3>
      </div>
      
      {/* Month/Year Navigation with Dropdowns */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-1 hover:bg-gray-100 rounded text-gray-600"
        >
          ←
        </button>
        
        <div className="flex items-center gap-2">
          {/* Month Dropdown */}
          <select
            value={currentMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="text-sm font-medium text-gray-900 bg-transparent border-0 focus:ring-0 cursor-pointer"
          >
            {monthNames.map((month, index) => (
              <option key={index} value={index}>
                {month}
              </option>
            ))}
          </select>
          
          {/* Year Dropdown */}
          <select
            value={currentYear}
            onChange={(e) => handleYearChange(e.target.value)}
            className="text-sm font-medium text-gray-900 bg-transparent border-0 focus:ring-0 cursor-pointer"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-1 hover:bg-gray-100 rounded text-gray-600"
        >
          →
        </button>
      </div>
      
      {/* Calendar Grid */}
      <div className="mb-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((dayObj, index) => (
            <button
              key={index}
              onClick={() => handleDateClick(dayObj.date)}
              className={`
                h-7 w-7 text-xs rounded transition-colors
                ${dayObj.isCurrentMonth 
                  ? 'text-gray-900 hover:bg-blue-100' 
                  : 'text-gray-400 hover:bg-gray-100'
                }
                ${dayObj.isSelected 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : ''
                }
                ${dayObj.isToday && !dayObj.isSelected 
                  ? 'bg-blue-100 text-blue-600 font-semibold' 
                  : ''
                }
              `}
            >
              {dayObj.day}
            </button>
          ))}
        </div>
      </div>
      
      {/* Time Selection */}
      <div className="space-y-3">
        {/* Time Display */}
        <div className="text-center text-sm font-mono bg-gray-50 py-2 rounded">
          {formatTimeDisplay()}
        </div>
        
        {/* Time Selectors with Format Toggle */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {/* Hour Selector */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Hour</label>
              <select
                value={selectedHour}
                onChange={(e) => handleTimeChange('hour', parseInt(e.target.value))}
                className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i;
                  let displayValue, displayText;
                  
                  if (is24Hour) {
                    displayValue = hour;
                    displayText = String(hour).padStart(2, '0');
                  } else {
                    displayValue = hour;
                    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    displayText = `${displayHour} ${ampm}`;
                  }
                  
                  return (
                    <option key={hour} value={displayValue}>
                      {displayText}
                    </option>
                  );
                })}
              </select>
            </div>
            
            {/* Minute Selector */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Minute</label>
              <select
                value={selectedMinute}
                onChange={(e) => handleTimeChange('minute', parseInt(e.target.value))}
                className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* 12h/24h Format Toggle - Positioned near time selectors */}
          <div className="flex justify-center">
            <button
              onClick={() => setIs24Hour(!is24Hour)}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
            >
              {is24Hour ? '24h' : '12h'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
        <div className="flex gap-3">
          {/* Clear and Today as blue text links */}
          <button
            onClick={handleClear}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            Clear
          </button>
          <button
            onClick={handleToday}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            Today
          </button>
        </div>
        <button
          onClick={handleDone}
          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Done
        </button>
      </div>
    </div>
  );
};
export default App

