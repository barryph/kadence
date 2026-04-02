import { useEffect, useRef, useState } from "react";
import "./Select.css";
import AddCategoryModal from "./AddCategoryModal.tsx";

// TODO: Add scroll area
// TODO: Rename from Select
// TODO: Add deselect selected category
// TODO: Add dropdown icon

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  label?: string;
  placeholder?: string;
}

export default function Select({
  onCreate,
  options,
  placeholder,
  className,
  label,
  ...props
}: SelectProps) {
  const dropdownRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleClickAddNew() {
    setShowCreateCategoryModal(true);
    setShowDropdown(false);
  }

  function handleSave(category) {
    setSelectedCategory(category);
    setShowCreateCategoryModal(false);
    setShowDropdown(false);
    onCreate(category);
  }

  function selectCategory(category) {
    setSelectedCategory(category);
    setShowDropdown(false);
  }

  return (
    <>
      <div className="base_select_wrapper" ref={dropdownRef}>
        <label>{label}</label>
        <div
          onClick={() => {
            setShowDropdown(!showDropdown);
          }}
          className={`base_select ${className} ${!selectedCategory ? "faint" : ""}`}
          {...props}
        >
          {selectedCategory ? (
            <>
              {selectedCategory.name}
              <span
                className="item_dot"
                style={{ background: selectedCategory.color }}
              />
            </>
          ) : (
            placeholder || "Choose a category"
          )}
          <span className="dropdown_arrow">&#10148;</span>
        </div>
        {showDropdown && (
          <div className="base_select_dropdown">
            {options.map((option) => (
              <div
                onClick={() => selectCategory(option)}
                className="dropdown_item"
              >
                {option.name}
                <span
                  className="item_dot"
                  style={{ background: option.color }}
                />
              </div>
            ))}
            <div className="dropdown_item" onClick={handleClickAddNew}>
              <strong>&#43; Create Category</strong>
            </div>
          </div>
        )}
      </div>
      {showCreateCategoryModal && (
        <AddCategoryModal
          onSave={(category) => handleSave(category)}
          onClose={() => setShowCreateCategoryModal(false)}
        />
      )}
    </>
  );
}
