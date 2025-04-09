import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { FileIcon, UploadCloudIcon, XIcon } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { useRef, useState } from "react";
import axios from "axios";

function CommonForm({
  formControls,
  formData,
  setFormData,
  onSubmit,
  buttonText,
  isBtnDisabled,
}) {
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const inputRefs = useRef({});

  function renderInputsByComponentType(getControlItem) {
    let element = null;
    const value = formData[getControlItem.name] || "";

    switch (getControlItem.componentType) {
      case "input":
        element = (
          <div className="space-y-2">
            <Label htmlFor={getControlItem.name} className="flex items-center gap-2">
              {getControlItem.label}
              {getControlItem.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              name={getControlItem.name}
              placeholder={getControlItem.placeholder}
              id={getControlItem.name}
              type={getControlItem.type}
              value={value}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  [getControlItem.name]: event.target.value,
                })
              }
              required={getControlItem.required}
            />
          </div>
        );
        break;

      case "file":
        const handleImageFileChange = async (event) => {
          const selectedFile = event.target.files?.[0];
          if (selectedFile) {
            setImageLoadingStates(prev => ({ ...prev, [getControlItem.name]: true }));
            const data = new FormData();
            data.append("my_file", selectedFile);
            
            try {
              const response = await axios.post(
                "http://localhost:5000/api/auth/upload-image",
                data,
                {
                  headers: {
                    'Content-Type': 'multipart/form-data'
                  }
                }
              );
              
              if (response?.data?.success) {
                setFormData({
                  ...formData,
                  [getControlItem.name]: response.data.result.url,
                });
              } else {
                throw new Error('Failed to upload image');
              }
            } catch (error) {
              console.error("Error uploading image:", error);
              // Afficher une notification d'erreur ici si nécessaire
            } finally {
              setImageLoadingStates(prev => ({ ...prev, [getControlItem.name]: false }));
            }
          }
        };

        const handleRemoveImage = () => {
          setFormData({
            ...formData,
            [getControlItem.name]: "",
          });
          if (inputRefs.current[getControlItem.name]) {
            inputRefs.current[getControlItem.name].value = "";
          }
        };

        element = (
          <div className="space-y-2">
            <Label htmlFor={getControlItem.name} className="flex items-center gap-2">
              {getControlItem.label}
              {getControlItem.required && <span className="text-red-500">*</span>}
            </Label>
            <div className="border-2 border-dashed rounded-lg p-4">
              <Input
                id={getControlItem.name}
                type="file"
                className="hidden"
                ref={el => inputRefs.current[getControlItem.name] = el}
                onChange={handleImageFileChange}
                accept="image/*"
                required={getControlItem.required}
              />
              {!formData[getControlItem.name] ? (
                <Label
                  htmlFor={getControlItem.name}
                  className="flex flex-col items-center justify-center h-32 cursor-pointer"
                >
                  <UploadCloudIcon className="w-10 h-10 text-muted-foreground mb-2" />
                  <span>Drag & drop or click to upload image</span>
                </Label>
              ) : imageLoadingStates[getControlItem.name] ? (
                <Skeleton className="h-10 bg-gray-100" />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileIcon className="w-8 text-primary mr-2 h-8" />
                    <img src={formData[getControlItem.name]} alt="Uploaded" className="w-16 h-16 object-cover ml-2" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={handleRemoveImage}
                    type="button"
                  >
                    <XIcon className="w-4 h-4" />
                    <span className="sr-only">Remove File</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
        break;

      case "select":
        element = (
          <div className="space-y-2">
            <Label htmlFor={getControlItem.name} className="flex items-center gap-2">
              {getControlItem.label}
              {getControlItem.required && <span className="text-red-500">*</span>}
            </Label>
            <Select
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  [getControlItem.name]: value,
                })
              }
              value={value}
              required={getControlItem.required}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={getControlItem.label} />
              </SelectTrigger>
              <SelectContent>
                {getControlItem.options && getControlItem.options.length > 0
                  ? getControlItem.options.map((optionItem) => (
                      <SelectItem key={optionItem.id} value={optionItem.id}>
                        {optionItem.label}
                      </SelectItem>
                    ))
                  : null}
              </SelectContent>
            </Select>
          </div>
        );
        break;

      case "textarea":
        element = (
          <div className="space-y-2">
            <Label htmlFor={getControlItem.name} className="flex items-center gap-2">
              {getControlItem.label}
              {getControlItem.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              name={getControlItem.name}
              placeholder={getControlItem.placeholder}
              id={getControlItem.id}
              value={value}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  [getControlItem.name]: event.target.value,
                })
              }
              required={getControlItem.required}
            />
          </div>
        );
        break;

      default:
        element = (
          <div className="space-y-2">
            <Label htmlFor={getControlItem.name} className="flex items-center gap-2">
              {getControlItem.label}
              {getControlItem.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              name={getControlItem.name}
              placeholder={getControlItem.placeholder}
              id={getControlItem.name}
              type={getControlItem.type}
              value={value}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  [getControlItem.name]: event.target.value,
                })
              }
              required={getControlItem.required}
            />
          </div>
        );
        break;
    }

    return element;
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="flex flex-col gap-4">
        {formControls.map((controlItem) => (
          <div key={controlItem.name}>
            {renderInputsByComponentType(controlItem)}
          </div>
        ))}
      </div>
      <Button disabled={isBtnDisabled} type="submit" className="mt-4 w-full">
        {buttonText || "Submit"}
      </Button>
    </form>
  );
}

export default CommonForm;
