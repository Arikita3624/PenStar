import ReactQuill from "react-quill-new";

type Props = {
  value?: string;
  onChange?: (v: string) => void;
  className?: string;
};

// QuillEditor: wrapper that forces full width and larger height by default
const QuillEditor = ({ value, onChange, className }: Props) => {
  return (
    <div className={"quill-editor-full " + (className ?? "")}>
      <ReactQuill value={value ?? ""} onChange={onChange} />
    </div>
  );
};

export default QuillEditor;
