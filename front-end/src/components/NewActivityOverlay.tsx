import { useState } from "react";
import { useForm } from "react-hook-form";
import "./NewActivityOverlay.css";
import Input from "./Input";
import CategorySelect from "./CategorySelect";
import Button from "./Button";
import { activitiesAPI, type IActivity, type ICategory } from "../api/api.activity";

interface NewActivitOverlayProps {
  onClose: (activity?: IActivity) => void;
}

interface FormData {
  name: string;
  ticker: string;
  interval: string;
  lastDone: string;
}

export default function NewActivity({ onClose }: NewActivitOverlayProps) {
  const { register, handleSubmit } = useForm<FormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<null | string>(null);

  // TODO: Fetch categories list from server
  const [categories, setCategories] = useState<ICategory[]>([
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
  function addCategory(category: ICategory) {
    setCategories([...categories, category]);
  }

  async function handleHandleSubmit(data: FormData) {
    setIsLoading(true);
    setErrorMessage(null);
    const response = await activitiesAPI.createActivity({
      name: data.name,
      ticker: data.ticker,
      interval: Number.parseInt(data.interval, 10),
      lastDone: data.lastDone,
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
    <div className="overlay_new_activity container">
      <div className="overlay_new_activity_content">
        <div className="close_button" onClick={() => onClose()}>
          &#10005;
        </div>
        <h1 className="title">New activity</h1>
        <form onSubmit={handleSubmit(handleHandleSubmit)}>
          <div className="input_row">
            <Input
              label="Name"
              placeholder="Name"
              className="input"
              {...register("name")}
            />
          </div>
          <div className="input_row">
            <Input
              label="Ticker (optional)"
              placeholder="Ticker"
              className="input"
              {...register("ticker")}
            />
          </div>
          <div className="input_row">
            <Input
              label="Interval (days)"
              placeholder="Interval (days)"
              type="number"
              className="input"
              {...register("interval")}
            />
          </div>
          <div className="input_row">
            <CategorySelect
              label="Category (optional)"
              placeholder="Choose a Category"
              className="input"
              options={categories}
              onCreate={(category) => addCategory(category)}
            />
          </div>
          <div className="input_row">
            <Input
              label="Last Done (optional)"
              placeholder="Last Done"
              type="date"
              className="input"
              max={today}
              {...register("lastDone")}
            />
          </div>

          {errorMessage && (
            <div>{errorMessage}</div>
          )}
          <Button isLoading={isLoading} className="submit_button" type="submit">
            Create
          </Button>
        </form>
      </div>
    </div>
  );
}
