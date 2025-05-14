import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const WeeklyCaloriesChart = ({ weeklyCalorieDates, weeklyCalories }) => {
  if (!weeklyCalorieDates || weeklyCalorieDates.length === 0) return null;

  const data = {
    labels: weeklyCalorieDates,
    datasets: [
      {
        label: "Calories",
        data: weeklyCalories,
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      title: { display: true, text: "Weekly Calorie Intake" },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Calories" },
      },
      x: {
        title: { display: true, text: "Date" },
      },
    },
  };

  return (
    <div style={{ position: 'relative', height: '400px', width: '100%' }}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default WeeklyCaloriesChart;
