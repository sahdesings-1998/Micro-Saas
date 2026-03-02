import { useEffect, useRef } from "react";
import AirDatepicker from "air-datepicker";
import localeEn from "air-datepicker/locale/en";
import "air-datepicker/air-datepicker.css";
import "../css/datepicker-override.css";

const formatDateForInput = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const DatePicker = ({
  value = "",
  onChange,
  placeholder = "Select date",
  className = "",
  id,
  disabled = false,
  minDate,
  maxDate,
  ...rest
}) => {
  const inputRef = useRef(null);
  const dpRef = useRef(null);

  useEffect(() => {
    if (!inputRef.current) return;

    dpRef.current = new AirDatepicker(inputRef.current, {
      locale: localeEn,
      dateFormat: "yyyy-MM-dd",
      autoClose: true,
      buttons: ["clear", "today"],
      selectedDates: value ? [new Date(value)] : [],
      onSelect: ({ date, formattedDate }) => {
        const str = date
          ? (formattedDate || formatDateForInput(date))
          : "";
        onChange?.(str);
      },
      ...(minDate && { minDate: new Date(minDate) }),
      ...(maxDate && { maxDate: new Date(maxDate) }),
    });

    return () => {
      dpRef.current?.destroy();
      dpRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!dpRef.current) return;
    if (value) {
      dpRef.current.selectDate([new Date(value)]);
      dpRef.current.setViewDate(new Date(value));
    } else {
      dpRef.current.clear();
    }
  }, [value]);

  useEffect(() => {
    if (dpRef.current) {
      if (minDate) dpRef.current.update({ minDate: new Date(minDate) });
      if (maxDate) dpRef.current.update({ maxDate: new Date(maxDate) });
    }
  }, [minDate, maxDate]);

  return (
    <input
      ref={inputRef}
      type="text"
      readOnly
      value={value}
      placeholder={placeholder}
      className={`sa-form-input sa-datepicker-input ${className}`.trim()}
      id={id}
      disabled={disabled}
      aria-label={placeholder}
      {...rest}
    />
  );
};

export default DatePicker;
