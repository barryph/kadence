import { useState } from 'react';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import './AddCategoryModal.css';

export default function AddCategoryModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  function save() {
    const category = {
      name,
      color,
    };
    onSave(category);
  }
  return (
    <Modal
      title="Create A Category"
      onFocusOut={onClose}
      className="add_category_modal"
    >
      <div className="input_row">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          label="Name"
          placeholder="Legs..."
        />
      </div>
      <div className="input_row">
        <Input
          value={color}
          type="color"
          onChange={(event) => setColor(event.target.value)}
          label="Color"
          placeholder="Red..."
          className="color_input"
        />
      </div>
      <div className="modal__buttons">
        <Button variant="outline" color="grey" className="modal_button" onClick={onClose}>Cancel</Button>
        <Button color="go" className="modal_button" onClick={save}>Save</Button>
      </div>
    </Modal>
  );
}
