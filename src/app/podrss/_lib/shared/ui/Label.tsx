export const Label = ({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) => (
  <label className="block text-m font-semibold text-gray-300 mb-1.5">
    {children}
    {required && <span className="text-key-color ml-0.5">*</span>}
  </label>
);


