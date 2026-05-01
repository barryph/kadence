import { useState } from "react";
import { activitiesAPI, type IActivity } from "../../api/api.activity";

interface IProps {
  activity: IActivity
}

export default function ActivityEdit({ activity }: IProps) {
  const [name, setName] = useState<string>("");
  const [ticker, setTicker] = useState<string>("");
  const [interval, setInterval] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<null | string>(null);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setErrorMessage(null);
    const response = await activitiesAPI.editActivity({
      id: activity.id,
      name,
      ticker,
      interval,
    });
    if (response.error) {
      setErrorMessage(response.error.message);
      setIsLoading(false);
      return;
    }
  }

  return (
    <>
      EDIT ACTIVITY
    </>
  )
}
