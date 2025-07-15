import { useState, useEffect, useContext, useCallback } from "react";
import { LoginContext } from "../contexts/LoginContext";
import WeightProgressChart from "../components/WeightProgressChart";
import SpendingProgressChart from "../components/SpendingProgressChart";
import WeeklyCaloriesChart from "../components/WeeklyCaloriesChart";
import "./ProgressPage.css";

const BACKEND_API_URL =
  import.meta.env.REACT_APP_API_URL || "http://127.0.0.1:5000/api";
// Helper fcn for getting the current week's start and end dates
const getCurrentWeekDates = () => {
  const today = new Date();
  const firstDayOfWeek = new Date(
    today.setDate(today.getDate() - today.getDay())
  ); // Sunday
  const lastDayOfWeek = new Date(today.setDate(firstDayOfWeek.getDate() + 6)); // Saturday

  return {
    start: firstDayOfWeek.toISOString().split("T")[0],
    end: lastDayOfWeek.toISOString().split("T")[0],
  };
};

const ProgressPage = () => {
  const { isLoggedIn, user } = useContext(LoginContext);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // For plotting against weekly budget in spending chart
  const [weeklySpending, setWeeklySpending] = useState(0);
  const [weeklyDates, setWeeklyDates] = useState([]);

  // for charting weekly calorie intake
  const [weeklyCalories, setWeeklyCalories] = useState([]);
  const [weeklyCalorieDates, setWeeklyCalorieDates] = useState([]);

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

    try {
      const [historyResponse, profileResponse] = await Promise.all([
        fetch(`${BACKEND_API_URL}/user/weight_history?email=${user.email}`),
        fetch(`${BACKEND_API_URL}/user?email=${user.email}`),
      ]);

      if (!profileResponse.ok)
        throw new Error(
          `Failed to fetch profile: ${profileResponse.statusText} (Status: ${profileResponse.status})`
        );
      const profileData = await profileResponse.json();
      setUserProfile(profileData);

      if (!historyResponse.ok)
        throw new Error(
          `Failed to fetch weight history: ${historyResponse.statusText} (Status: ${historyResponse.status})`
        );
      const fetchedHistoryData = await historyResponse.json();

      // The backend directly returns an object with 'labels' and 'data' keys
      const actualWeightLabels = fetchedHistoryData.labels;
      const actualWeightValues = fetchedHistoryData.data;

      if (
        !actualWeightLabels ||
        !actualWeightValues ||
        actualWeightValues.length < 1
      ) {
        setError(
          "No weight data logged yet. Log your weight to see the chart."
        );
        setChartData({ labels: [], datasets: [] });
        setIsLoading(false);
        return;
      }

      setError(null); // Clear any previous "no data" error

      let targetWeights = [];

      // --- Target Weight Calculation (needs profileData and actualWeights) ---
      if (
        profileData &&
        profileData.goal &&
        actualWeightValues.length > 0 &&
        profileData.units
      ) {
        const goalStartDateStr = actualWeightLabels[0]; // Use first date in history as start
        const goalStartWeight = actualWeightValues[0]; // Use first weight as start
        const goalRate = parseInt(profileData.goal, 10);
        let weeklyChangeInNativeUnits = 0;

        if (profileData.units.toLowerCase() === "standard") {
          weeklyChangeInNativeUnits = goalRate;
        } else if (profileData.units.toLowerCase() === "metric") {
          weeklyChangeInNativeUnits = goalRate * 0.453592; // Convert lbs goal to kg change
        }

        if (
          !isNaN(goalRate) &&
          goalRate !== 0 &&
          weeklyChangeInNativeUnits !== 0
        ) {
          targetWeights = actualWeightLabels.map((labelDate) => {
            const startDate = new Date(goalStartDateStr + "T00:00:00Z"); // Use Z for UTC to be safe
            const currentDate = new Date(labelDate + "T00:00:00Z");
            const timeDiff = currentDate.getTime() - startDate.getTime();
            const daysPassed = timeDiff / (1000 * 3600 * 24);
            const weeksPassed = daysPassed / 7;
            const target =
              goalStartWeight + weeksPassed * weeklyChangeInNativeUnits;
            return parseFloat(target.toFixed(1));
          });
        }
      }
      // --- End Target Weight Calculation ---

      const datasets = [
        {
          label: `Actual Weight (${profileData?.units || "N/A"})`,
          data: actualWeightValues,
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          tension: 0.1,
        },
      ];

      if (targetWeights.length > 0) {
        datasets.push({
          label: `Target Weight (${profileData?.units || "N/A"})`,
          data: targetWeights,
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgba(255, 99, 132, 0.5)",
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

  const fetchWeeklySpending = async () => {
    if (!isLoggedIn || !user?.email) return;

    const { start, end } = getCurrentWeekDates();

    try {
      const response = await fetch(
        `${BACKEND_API_URL}/user/spending_logs?email=${user.email}`
      );
      const result = await response.json();

      if (response.ok) {
        // Process logs for the current week
        const weeklyLogs = {};
        for (
          let d = new Date(start);
          d <= new Date(end);
          d.setDate(d.getDate() + 1)
        ) {
          const currentDate = d.toISOString().split("T")[0];
          weeklyLogs[currentDate] = result.logs[currentDate] || [];
        }

        // Calculate daily and cumulative totals
        const dates = [];
        const spendingTotals = [];
        let cumulativeTotal = 0;

        Object.keys(weeklyLogs).forEach((date) => {
          dates.push(date);
          const dailyTotal = weeklyLogs[date].reduce(
            (sum, log) => sum + log.amount,
            0
          );
          cumulativeTotal += dailyTotal;
          spendingTotals.push(cumulativeTotal);
        });

        setWeeklySpending(spendingTotals);
        setWeeklyDates(dates);
      } else {
        console.error("Error fetching spending logs:", result.message);
      }
    } catch (error) {
      console.error("Error fetching spending logs:", error);
    }
  };

  const fetchWeeklyCalories = async () => {
    if (!isLoggedIn || !user?.email) return;

    const { start, end } = getCurrentWeekDates();

    try {
      const response = await fetch(
        `${BACKEND_API_URL}/food_logs?email=${user.email}`
      );
      const result = await response.json();

      if (response.ok && result.logs) {
        const weeklyLogs = {};
        for (
          let d = new Date(start);
          d <= new Date(end);
          d.setDate(d.getDate() + 1)
        ) {
          const date = new Date(d);
          const currentDate = date.toISOString().split("T")[0];
          const dayLog = result.logs[currentDate];
          weeklyLogs[currentDate] = dayLog?.dailyTotals?.calories ?? 0;
        }

        const dates = Object.keys(weeklyLogs);
        const calories = Object.values(weeklyLogs);

        setWeeklyCalorieDates(dates);
        setWeeklyCalories(calories);
      } else {
        console.error("Error fetching food logs:", result.message);
      }
    } catch (err) {
      console.error("Error fetching weekly calories:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchWeeklySpending();
      fetchWeeklyCalories();
    }
  }, [isLoggedIn]);

  return (
    <div className="progress-page-container">
      <div className="progress-page-content">
        <h1 style={{ textAlign: "center" }}>Your Progress</h1>
        <h2 style={{ textAlign: "center" }}>Weekly Calorie Intake</h2>
        <WeeklyCaloriesChart
          weeklyCalorieDates={weeklyCalorieDates}
          weeklyCalories={weeklyCalories}
        />
        <h2 style={{ textAlign: "center" }}>Weight Progress</h2>
        <WeightProgressChart
          chartData={chartData}
          userProfile={userProfile}
          isLoading={isLoading}
          error={error}
          isLoggedIn={isLoggedIn}
        />
        <h2 style={{ textAlign: "center" }}>Weekly Spending Progress</h2>
        <SpendingProgressChart
          weeklyDates={weeklyDates}
          weeklySpending={weeklySpending}
          weeklyBudget={userProfile?.weeklyBudget || 0}
        />
      </div>
    </div>
  );
};

export default ProgressPage;
