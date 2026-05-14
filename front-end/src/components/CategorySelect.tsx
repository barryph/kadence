import { useEffect, useRef, useState } from "react";
import "./CategorySelect.css";
import AddCategoryModal from "./AddCategoryModal.tsx";
import type { ICategory } from "../api/api.activity.ts";

// TODO: Add scroll area
// TODO: Add deselect selected category
// TODO: Add dropdown icon

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  label?: string;
  placeholder?: string;
  options: ICategory[];
  onCreate: (category: ICategory) => void;
}

export default function CategorySelect({
  onCreate,
  options,
  placeholder,
  className,
  label,
  ...props
}: SelectProps) {
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(null);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
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

  function handleSave(category: ICategory) {
    setSelectedCategory(category);
    setShowCreateCategoryModal(false);
    setShowDropdown(false);
    onCreate(category);
  }

  function selectCategory(category: ICategory) {
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
