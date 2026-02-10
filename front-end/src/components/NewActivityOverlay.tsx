import { useState } from 'react';
import './NewActivitOverlay.css';
import Input from './Input';
import Select from './Select';
import Button from './Button';

export default function NewActivity({ onClose }) {
  const [categories, setCategories] = useState([
    {
      name: 'Sprint',
      color: 'green',
    },
    {
      name: 'Jump',
      color: 'red',
    },
    {
      name: 'BB',
      color: 'blue',
    }
  ])
  function addCategory(category) {
    setCategories([...categories, category]);
  }
  return (
    <div className="overlay_new_activity">
      <div className="overlay_new_activity_content">
        <div className="close_button" onClick={onClose}>&#10540;</div>
        <h1 className="title">New activity</h1>
        <form>
          <div className="input_row">
            <Input label="Name" placeholder="Name" className="input" />
          </div>
          <div className="input_row">
            <Input label="Ticker (optional)" placeholder="Ticker" className="input" />
          </div>
          <div className="input_row">
            <Input label="Interval (days)" placeholder="Interval (days)" type="number" className="input" />
          </div>
          <div className="input_row">
            <Select
              label="Category"
              placeholder="Choose a Category"
              className="input"
              options={categories}
              onCreate={(category) => addCategory(category)}
            />
          </div>
          <div className="input_row">
            <Input label="Last Done (optional)" placeholder="Last Done" type="date" className="input" />
          </div>

          <Button className="add_button" type="submit">Create</Button>
        </form>
      </div>
    </div>
  );
}
