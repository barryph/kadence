import { useState } from "react";
import "./NewActivitOverlay.css";
import Input from "./Input";
import Select from "./Select";
import Button from "./Button";
import { activitiesAPI, type IActivity } from "../api/api.activity";

interface NewActivitOverlayProps {
  onClose: (activity?: IActivity) => void;
}

export default function NewActivity({ onClose }: NewActivitOverlayProps) {
  const [name, setName] = useState<string>("");
  const [ticker, setTicker] = useState<string>("");
  const [interval, setInterval] = useState<number>(1);
  const [lastDone, setLastDone] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<null | string>(null);

  const [categories, setCategories] = useState([
    {
      name: "Sprint",
      color: "green",
    },
    {
      name: "Jump",
      color: "red",
    },
    {
      name: "BB",
      color: "blue",
    },
  ]);
  function addCategory(category) {
    setCategories([...categories, category]);
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setErrorMessage(null);
    const response = await activitiesAPI.createActivity({
      name,
      ticker,
      interval,
      lastDone,
    });
    if (response.error) {
      setErrorMessage(response.error.message);
      setIsLoading(false);
      return;
    }
    onClose(response.data.activity);
  }

  const today = new Date().toISOString().split('T')[0]; // String formatted as: YYYY-MM-DD

  return (
    <div className="overlay_new_activity">
      <div className="overlay_new_activity_content">
        <div className="close_button" onClick={() => onClose()}>
          &#10540;
        </div>
        <h1 className="title">New activity</h1>
        <form onSubmit={(event) => handleSubmit(event)}>
          <div className="input_row">
            <Input
              label="Name"
              placeholder="Name"
              className="input"
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="input_row">
            <Input
              label="Ticker (optional)"
              placeholder="Ticker"
              className="input"
              onChange={(event) => setTicker(event.target.value)}
            />
          </div>
          <div className="input_row">
            <Input
              label="Interval (days)"
              placeholder="Interval (days)"
              type="number"
              className="input"
              onChange={(event) =>
                setInterval(parseInt(event.target.value, 10))
              }
            />
          </div>
          <div className="input_row">
            <Select
              label="Category (optional)"
              placeholder="Choose a Category"
              className="input"
              options={categories}
              onCreate={(category) => addCategory(category)}
            />
          </div>
          <div className="input_row">
            {lastDone}
            <Input
              label="Last Done (optional)"
              placeholder="Last Done"
              type="date"
              className="input"
              onChange={(event) =>
                setLastDone(event.target.value)
              }
              max={today}
            />
          </div>

          <Button isLoading={isLoading} className="add_button" type="submit">
            Create
          </Button>
        </form>
      </div>
    </div>
  );
}
