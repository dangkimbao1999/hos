import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { UploadSlot } from "@/components/shared/upload-slot";

afterEach(() => cleanup());

describe("UploadSlot", () => {
  it("shows the label and forwards a selected file", () => {
    const onFileSelected = mock(() => {});
    render(
      <UploadSlot label="Add Photo 1" filled={false} onFileSelected={onFileSelected} />
    );

    expect(screen.getByText("Add Photo 1")).toBeInTheDocument();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["photo"], "venue.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(onFileSelected).toHaveBeenCalledWith(file);
  });

  it("renders the preview image and a labeled remove button when filled", () => {
    const onRemove = mock(() => {});
    render(
      <UploadSlot
        label="Photo 1 uploaded"
        filled
        previewUrl="https://example.com/photo.png"
        onFileSelected={() => {}}
        onRemove={onRemove}
      />
    );

    expect(document.querySelector('img[src="https://example.com/photo.png"]')).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Remove Photo 1 uploaded" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("shows the error message when provided", () => {
    render(
      <UploadSlot label="Add Photo 1" filled={false} error="Upload failed" onFileSelected={() => {}} />
    );
    expect(screen.getByText("Upload failed")).toBeInTheDocument();
  });

  it("disables interaction while pending", () => {
    render(
      <UploadSlot label="Add Photo 1" filled={false} pending onFileSelected={() => {}} />
    );
    expect(screen.getByRole("button", { name: /Add Photo 1/ })).toBeDisabled();
  });
});
