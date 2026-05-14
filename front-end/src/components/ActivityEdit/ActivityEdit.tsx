import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import "./ActivityEdit.css";
import { activitiesAPI, type IActivity } from "../../api/api.activity";
import Input from "../Input";
import Button from "../Button";
import { useNavigate } from "@tanstack/react-router";

interface IProps {
  activity: IActivity
}

interface FormData {
  name: string;
  ticker: string;
  interval: string;
}

export default function ActivityEdit({ activity }: IProps) {
  const navigate = useNavigate()
  const { register, handleSubmit, setValue } = useForm<FormData>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<null | string>(null);
  const [savingErrorMessage, setSavingErrorMessage] = useState<null | string>(null);

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchData() {
      setIsLoading(true);
      try {
        const response = await activitiesAPI.getById(activity.id, { signal: abortController.signal });
        console.log('response', response);
        if (response.data?.activity) {
          const activity = response.data.activity;
          setValue("name", activity.name)
          setValue("ticker", activity.ticker ?? "")
          setValue("interval", activity.interval.toString() ?? "")
        } else {
          setErrorMessage("Failed to find the activity");
        }
        setErrorMessage(null);
      } catch (err) {
        console.error('Error fetching activity', err);
        setErrorMessage("Failed to find the activity");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
    return () => abortController.abort();
  }, [activity.id, setValue])

  async function handleHandleSubmit(data: FormData) {
    setIsSaving(true);
    setSavingErrorMessage(null);
    const response = await activitiesAPI.editActivity(activity.id, {
      name: data.name,
      ticker: data.ticker,
      interval: Number.parseInt(data.interval, 10),
    });
    if (response.error) {
      setSavingErrorMessage(response.error.message);
      setIsSaving(false);
      return;
    }

    // Return to activities page
    navigate({ to: '/' })
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (errorMessage) {
    return <div>{errorMessage}</div>;
  }

  return (
    <div className="container activity_edit">
      <h1 className="title">Update activity</h1>
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

        {savingErrorMessage && (
          <div>{savingErrorMessage}</div>
        )}
        <Button isLoading={isSaving} className="submit_button" type="submit">
          Update
        </Button>
      </form>
    </div>
  )
}
