// src/components/election/RegistrationRequirements.tsx
export const RegistrationRequirements: React.FC = () => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <h3 className="font-medium mb-2">Registration Requirements</h3>
    <ul className="space-y-2">
      <li className="flex items-center text-sm text-gray-600">
        <div
          className="h-2 w-2 rounded-full bg-green-500 mr-2"
          aria-hidden="true"
        ></div>
        Active voter status required
      </li>
      <li className="flex items-center text-sm text-gray-600">
        <div
          className="h-2 w-2 rounded-full bg-green-500 mr-2"
          aria-hidden="true"
        ></div>
        One registration per election
      </li>
      <li className="flex items-center text-sm text-gray-600">
        <div
          className="h-2 w-2 rounded-full bg-green-500 mr-2"
          aria-hidden="true"
        ></div>
        Must meet eligibility criteria
      </li>
    </ul>
  </div>
);
