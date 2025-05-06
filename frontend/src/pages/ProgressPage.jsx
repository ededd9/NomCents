import React, { useState, useEffect, useContext, useCallback } from 'react';
import { LoginContext } from '../contexts/LoginContext';
import WeightProgressChart from '../components/WeightProgressChart';
import WeightLogger from '../components/WeightLogger';

const BACKEND_API_URL = "http://127.0.0.1:5000/api";

const ProgressPage = () => {
    const { isLoggedIn, user } = useContext(LoginContext);
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });
    const [userProfile, setUserProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [actionStatus, setActionStatus] = useState('');

    const fetchData = useCallback(async () => {

        if (!isLoggedIn || !user?.email) {
            setChartData({ labels: [], datasets: [] });
            setUserProfile(null);
            setError("Please log in to view progress.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        setActionStatus('');

        try {
            const [historyResponse, profileResponse] = await Promise.all([
                fetch(`${BACKEND_API_URL}/user/weight_history?email=${user.email}`),
                fetch(`${BACKEND_API_URL}/user?email=${user.email}`)
            ]);

            if (!profileResponse.ok) throw new Error(`Failed to fetch profile: ${profileResponse.statusText} (Status: ${profileResponse.status})`);
            const profileData = await profileResponse.json();
            setUserProfile(profileData); // Set profile first, critical for units and goal

            if (!historyResponse.ok) throw new Error(`Failed to fetch weight history: ${historyResponse.statusText} (Status: ${historyResponse.status})`);
            const fetchedHistoryData = await historyResponse.json(); 


            // The backend directly returns an object with 'labels' and 'data' keys
            const actualWeightLabels = fetchedHistoryData.labels;
            const actualWeightValues = fetchedHistoryData.data;

            if (!actualWeightLabels || !actualWeightValues || actualWeightValues.length < 1) {
                setError("No weight data logged yet. Log your weight to see the chart.");
                setChartData({ labels: [], datasets: [] });
                setIsLoading(false);
                return;
            }

            setError(null); // Clear any previous "no data" error

            let targetWeights = [];

            // --- Target Weight Calculation (needs profileData and actualWeights) ---
            if (profileData && profileData.goal && actualWeightValues.length > 0 && profileData.units) {
                 const goalStartDateStr = actualWeightLabels[0]; // Use first date in history as start
                 const goalStartWeight = actualWeightValues[0];  // Use first weight as start
                 const goalRate = parseInt(profileData.goal, 10);
                 let weeklyChangeInNativeUnits = 0;

                 if (profileData.units.toLowerCase() === 'standard') { 
                     weeklyChangeInNativeUnits = goalRate;
                 } else if (profileData.units.toLowerCase() === 'metric') { 
                     weeklyChangeInNativeUnits = goalRate * 0.453592; // Convert lbs goal to kg change
                 }

                 if (!isNaN(goalRate) && goalRate !== 0 && weeklyChangeInNativeUnits !== 0) {
                     targetWeights = actualWeightLabels.map(labelDate => {
                         const startDate = new Date(goalStartDateStr + 'T00:00:00Z'); // Use Z for UTC to be safe
                         const currentDate = new Date(labelDate + 'T00:00:00Z');
                         const timeDiff = currentDate.getTime() - startDate.getTime();
                         const daysPassed = timeDiff / (1000 * 3600 * 24);
                         const weeksPassed = daysPassed / 7;
                         const target = goalStartWeight + (weeksPassed * weeklyChangeInNativeUnits);
                         return parseFloat(target.toFixed(1));
                     });
                 }
            } 
            // --- End Target Weight Calculation ---

            const datasets = [{
                label: `Actual Weight (${profileData?.units || 'N/A'})`,
                data: actualWeightValues,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.1,
            }];

            if (targetWeights.length > 0) {
                datasets.push({
                    label: `Target Weight (${profileData?.units || 'N/A'})`,
                    data: targetWeights,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderDash: [5, 5],
                    tension: 0.1,
                });
            }
            setChartData({ labels: actualWeightLabels, datasets });

        } catch (err) {
            console.error("Error fetching data in ProgressPage (catch block):", err); // Log 
            setError(err.message || "Could not load data.");
            setChartData({ labels: [], datasets: [] });
        } finally {
            setIsLoading(false);
        }
    }, [isLoggedIn, user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleWeightLogged = () => {
        setActionStatus('');
        fetchData();
    };

    const handleDeleteLastWeightEntry = async () => {
        if (!isLoggedIn || !user?.email) { 
            setActionStatus('Error: User not logged in or identified.');
            return;
        }
        if (!window.confirm("Are you sure you want to delete your most recent weight entry? This cannot be undone.")) {
            return;
        }
        setActionStatus('Deleting last entry...');
        try {
            const response = await fetch(`${BACKEND_API_URL}/user/weight_log?email=${user.email}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (response.ok) {
                setActionStatus(`Success: ${result.message}`);
                fetchData();
            } else {
                setActionStatus(`Error: ${result.message || 'Failed to delete entry'}`);
            }
        } catch (err) {
            console.error("Error deleting last weight entry:", err);
            setActionStatus('Error: Could not connect to server for deletion.');
        }
    };


    let content;
    if (!isLoggedIn) {
        content = <p>Please log in to view and track your weight progress.</p>;
    } else if (isLoading) {
        content = <p>Loading progress...</p>;
    } else if (error) {
        content = <p style={{ color: 'red' }}>Error: {error}</p>;
    } else if (chartData.labels && chartData.labels.length > 0) {
        content = (
            <>
                <WeightProgressChart
                    chartData={chartData}
                    userProfile={userProfile}
                />
                {/* Delete button shown only if there's actual data in the first dataset */}
                {chartData.datasets?.[0]?.data?.length > 0 && (
                     <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <button
                            onClick={handleDeleteLastWeightEntry}
                            style={{ padding: '8px 15px', backgroundColor: '#cc0000', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Delete Last Weight Entry
                        </button>
                    </div>
                )}
            </>
        );
    } else if (userProfile) { // If logged in, profile fetched, but no chart data after loading & no error
        content = <p>No weight data logged yet. Add your current weight to start tracking!</p>;
    } else { // Fallback, possibly while profile is still loading or if user context isn't ready
        content = <p>Loading user data...</p>
    }


    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            <h2>Your Weight Progress</h2>
            {content}
            
            {isLoggedIn && userProfile && ( // Only show logger if logged in and profile is available
                <WeightLogger
                    onWeightLogged={handleWeightLogged}
                    userProfile={userProfile}
                />
            )}
            {actionStatus && <p style={{ marginTop: '10px', textAlign: 'center' }}><small>{actionStatus}</small></p>}
        </div>
    );
};

export default ProgressPage;