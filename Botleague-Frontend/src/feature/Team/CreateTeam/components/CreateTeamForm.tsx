import { useState } from "react";

import TeamHeader from "./TeamHeader";

import TeamInput from "./TeamInput";

import TeamLogoUpload from "./TeamLogoUpload";

import CreateTeamFooter from "./CreateTeamFooter";

import useCreateTeam from
"../hooks/useCreateTeam";

export default function CreateTeamForm() {

  const [focused, setFocused] =
    useState<string | null>(null);

  const {

    form,

    logoPreview,

    isLoading,

    error,

    handleChange,

    handleLogoUpload,

    handleSubmit,

  } = useCreateTeam();

  const fields = [
    {
      name: "teamName",
      label: "Team Name",
    },
    {
      name: "description",
      label: "Description",
    },
    {
      name: "institutionName",
      label: "Institution Name",
    },
    {
      name: "city",
      label: "City",
    },
    {
      name: "state",
      label: "State",
    },
    {
      name: "country",
      label: "Country",
    },
  ];

  return (

    <div
      style={{
        background: "#434343",
        padding: "36px 60px",
        minHeight: "100vh",
        color: "#fff",
      }}
    >

      <TeamHeader />

      <TeamLogoUpload
        logoPreview={logoPreview}
        onUpload={handleLogoUpload}
      />

      {/* Error */}
      {error && (

        <div
          style={{
            color: "#ff6b6b",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {/* Form */}
      <div className="grid grid-cols-2 gap-4">

        {fields.map((field) => (

          <TeamInput
            key={field.name}

            label={field.label}

            name={field.name}

            value={
              form[
                field.name as keyof typeof form
              ] || ""
            }

            placeholder={`Enter ${field.label.toLowerCase()}`}

            focused={
              focused === field.name
            }

            onFocus={() =>
              setFocused(field.name)
            }

            onBlur={() =>
              setFocused(null)
            }

            onChange={handleChange}
          />
        ))}
      </div>

      <CreateTeamFooter
        onSubmit={handleSubmit}
      />

      {isLoading && (
        <div
          style={{
            marginTop: "20px",
            color: "#9ca3af",
          }}
        >
          Creating Team...
        </div>
      )}
    </div>
  );
}