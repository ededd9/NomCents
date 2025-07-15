import { useState, useContext, useEffect } from "react";
import { LoginContext } from "../contexts/LoginContext";
import PopUp from "../components/PopUp";
import "./Profile.css";

const BACKEND_API_URL =
  process.env.REACT_APP_API_URL || "http://127.0.0.1:5000/api";

const Profile = () => {
  const { isLoggedIn, user } = useContext(LoginContext);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [dailyCal, setDailyCal] = useState("");
  const [goal, setGoal] = useState("");
  const [units, setUnits] = useState("");
  const [activity, setActivity] = useState("");
  const [weeklyBudget, setWeeklyBudget] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  //fetch profile info when user logs in

  useEffect(() => {
    if (isLoggedIn && user) {
      //fetch profile data
      fetchUserInformation(user.email);
    }
  }, [isLoggedIn, user]);

  const fetchUserInformation = async (email) => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/user?email=${email}`);

      if (response.ok) {
        const userData = await response.json();
        console.log("User data:", userData);
        setWeight(userData.weight || "");
        setHeight(userData.height || "");
        setAge(userData.age || "");
        setGender(userData.gender || "");
        setDailyCal(userData.dailyCal || "");
        setGoal(userData.goal || "");
        setUnits(userData.units || "");
        setActivity(userData.activity || "");
        setWeeklyBudget(userData.weeklyBudget || "");
      }
    } catch (error) {
      console.error("Error fetching user information:", error);
    }
  };

  const updateUserInformation = async () => {
    let email = user.email;
    try {
      await fetch(`${BACKEND_API_URL}/user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          weight,
          height,
          age,
          gender,
          dailyCal,
          goal,
          activity,
          units,
          weeklyBudget,
        }),
      });
      console.log("updating user with", {
        email,
        weight,
        height,
        age,
        gender,
        dailyCal,
        goal,
        units,
        activity,
        weeklyBudget,
      });

      // Show success popup
      setPopupMessage("Profile updated successfully!");
      setShowPopup(true);

      // Hide popup after 5 seconds
      setTimeout(() => {
        setShowPopup(false);
      }, 5000);
    } catch (error) {
      console.error("Error updating user information:", error);

      // Show error popup
      setPopupMessage("Failed to update profile. Please try again.");
      setShowPopup(true);

      // Hide popup after 5 seconds
      setTimeout(() => {
        setShowPopup(false);
      }, 5000);
    }
  };

  const handleGenderChange = (e) => {
    setGender(e.target.value);
  };
  const handleUnitsChange = (e) => {
    setUnits(e.target.value);
  };
  const handleGoalChange = (e) => {
    setGoal(e.target.value);
  };
  const handleActivityChange = (e) => {
    setActivity(e.target.value);
  };

  const handleDataChange = (e) => {
    const dataType = e.target.id;
    switch (dataType) {
      case "weight":
        setWeight(e.target.value);
        break;
      case "height":
        setHeight(e.target.value);
        break;
      case "age":
        setAge(e.target.value);
        break;
    }
  };

  const handleBMR = () => {
    if (weight != "" && height != "" && age != "" && gender != "") {
      //Calculate Base metabollic rate with the Mifflin -St Jeor equation
      //When the unit is in standard convert the weight and height into pounds and inches
      if (gender == "male") {
        if (units == "standard") {
          let kg = weight / 2.205;
          let inch = height * 2.54;
          let BMR = 10 * kg + 6.25 * inch - 5 * age + 5;
          BMR = BMR.toFixed(1);
          setDailyCal(BMR);
        } else {
          let kg = weight;
          let BMR = 10 * kg + 6.25 * height - 5 * age + 5;
          BMR = BMR.toFixed(1);
          setDailyCal(BMR);
        }
      }
      if (gender == "female") {
        if (units == "standard") {
          let kg = weight / 2.205;
          let inch = height * 2.54;
          let BMR = 10 * kg + 6.25 * inch - 5 * age - 161;
          BMR = BMR.toFixed(1);
          setDailyCal(BMR);
        } else {
          let kg = weight;
          let BMR = 10 * kg + 6.25 * height - 5 * age - 161;
          BMR = BMR.toFixed(1);
          setDailyCal(BMR);
        }
      }

      // Show success popup
      setPopupMessage(`BMR calculated successfully!`);
      setShowPopup(true);

      // Hide popup after 5 seconds
      setTimeout(() => {
        setShowPopup(false);
      }, 5000);
    } else {
      // Show error popup
      setPopupMessage("Please fill in all fields to calculate BMR.");
      setShowPopup(true);

      // Hide popup after 5 seconds
      setTimeout(() => {
        setShowPopup(false);
      }, 5000);
    }
  };

  const handleWeeklyBudgetChange = (e) => {
    setWeeklyBudget(e.target.value);
  };

  return (
    <div className="Profile">
      <h1>Nomcents Profile</h1>

      <div className="profile-container">
        {/* BMR Calculation Form Section */}
        <div className="bmr-calculation-form">
          <h2>Calculate BMR </h2>
          <div>
            <label>
              Units:
              <select value={units} onChange={handleUnitsChange}>
                <option value=""> Units </option>
                <option value="standard"> Standard</option>
                <option value="metric"> Metric</option>
              </select>
            </label>
          </div>

          <div>
            <label>
              Gender:
              <select value={gender} onChange={handleGenderChange}>
                <option value=""> Gender </option>
                <option value="male"> Male</option>
                <option value="female"> Female</option>
              </select>
            </label>
          </div>

          <div>
            {units === "standard" ? (
              <>
                <label>Weight:</label>
                <input
                  id="weight"
                  type="number"
                  value={weight}
                  onChange={handleDataChange}
                  placeholder="pounds"
                />
              </>
            ) : (
              <>
                <label>Weight:</label>
                <input
                  id="weight"
                  type="number"
                  value={weight}
                  onChange={handleDataChange}
                  placeholder="kg"
                />
              </>
            )}
          </div>

          <div>
            {units === "standard" ? (
              <>
                <label>Height:</label>
                <input
                  id="height"
                  type="number"
                  value={height}
                  onChange={handleDataChange}
                  placeholder="inches"
                />
              </>
            ) : (
              <>
                <label>Height:</label>
                <input
                  id="height"
                  type="number"
                  value={height}
                  onChange={handleDataChange}
                  placeholder="cm"
                />
              </>
            )}
          </div>

          <div>
            <label>Age:</label>
            <input
              id="age"
              type="number"
              value={age}
              onChange={handleDataChange}
            />
          </div>

          <div>
            <label>
              Goals:
              <select value={goal} onChange={handleGoalChange}>
                <option value=""> Goal </option>
                <option value="0"> Maintain weight</option>
                <option value="-1"> Lose one pound a week</option>
                <option value="-2"> Lose two pounds a week</option>
                <option value="1"> Gain one pound a week</option>
                <option value="2"> Gain two pounds a week</option>
              </select>
            </label>
          </div>

          <div>
            <label>
              Activity Level:
              <select value={activity} onChange={handleActivityChange}>
                <option value=""> Activity Level </option>
                <option value="1.2">
                  {" "}
                  Sedentary (little to no exercise + work a desk job)
                </option>
                <option value="1.375">
                  Lightly active (light exercise 1-3 days/week)
                </option>
                <option value="1.55">
                  {" "}
                  Moderately active(moderate exercise 3-5 days/week){" "}
                </option>
                <option value="1.75">
                  {" "}
                  Very active (heavy exercise 6-7 days/week){" "}
                </option>
                <option value="1.9">
                  {" "}
                  Extremely active (very heavy exercise, hard labor job,
                  training 2x/day){" "}
                </option>
              </select>
            </label>
          </div>

          <div>
            <label>Weekly Budget:</label>
            <input
              type="number"
              value={weeklyBudget}
              onChange={handleWeeklyBudgetChange}
              placeholder="Weekly Budget"
            />
          </div>

          <button onClick={handleBMR}>Calculate BMR</button>
        </div>

        {/* Current Calculations Section */}
        <div className="current-calculations">
          <h2>Your Current Calculations</h2>
          {isLoggedIn ? (
            <>
              <h3>Your Profile</h3>
              <p>Name: {user.name}</p>
              <p>Gender: {gender}</p>
              <p>Weight: {weight}</p>
              <p>Height: {height}</p>
              <p>Age: {age}</p>
              <p>Daily Calories: {dailyCal}</p>
              <p>Daily Calories for Goal: {dailyCal * activity + 500 * goal}</p>
              <p>Weekly Budget: {weeklyBudget}</p>
              <button onClick={updateUserInformation}>Save Information</button>
            </>
          ) : (
            <>
              <p>Daily Calories: {dailyCal}</p>
              <p>
                Daily Calories for Goal:{" "}
                {(dailyCal * activity + 500 * goal).toFixed(2)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Popup */}
      {showPopup && (
        <PopUp
          message={popupMessage}
          closePopup={() => setShowPopup(false)}
          showLoginButton={false} // Assuming no login button is needed here
        />
      )}
    </div>
  );
};

export default Profile;
