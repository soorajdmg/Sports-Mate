import { useState, useEffect } from 'react';
import { useVenue } from '../context/VenueContext';

const CheckinButton = ({ venue, sport, className = '' }) => {
  const { activeCheckin, checkinToVenue, checkout, getCheckinTimeRemaining } = useVenue();
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  const isCheckedInHere = activeCheckin?.placeId === venue.placeId;
  const hasOtherCheckin = activeCheckin && !isCheckedInHere;

  // Update time remaining every minute
  useEffect(() => {
    if (!isCheckedInHere) {
      setTimeRemaining(null);
      return;
    }

    const updateTime = () => {
      setTimeRemaining(getCheckinTimeRemaining());
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [isCheckedInHere, getCheckinTimeRemaining]);

  const handleCheckin = async () => {
    setLoading(true);
    await checkinToVenue(venue, sport);
    setLoading(false);
  };

  const handleCheckout = async () => {
    setLoading(true);
    await checkout();
    setLoading(false);
  };

  if (isCheckedInHere) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-center bg-green-100 text-green-700 py-2 px-4 rounded-lg">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">Checked In</span>
          {timeRemaining && (
            <span className="ml-2 text-sm">
              ({timeRemaining.hours > 0 ? `${timeRemaining.hours}h ` : ''}{timeRemaining.minutes}m left)
            </span>
          )}
        </div>
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
        >
          {loading ? 'Checking out...' : 'Check Out'}
        </button>
      </div>
    );
  }

  if (hasOtherCheckin) {
    return (
      <div className={`text-center ${className}`}>
        <p className="text-sm text-gray-500 mb-2">
          You're checked in at {activeCheckin.venueName}
        </p>
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
        >
          {loading ? 'Checking out...' : 'Check Out First'}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleCheckin}
      disabled={loading}
      className={`w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center ${className}`}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          Checking in...
        </>
      ) : (
        <>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Check In Here
        </>
      )}
    </button>
  );
};

export default CheckinButton;
