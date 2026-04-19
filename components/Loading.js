// components/Loading.js - Loading components

export function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

export function LoadingSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="bg-gray-200 h-12 rounded animate-pulse"></div>
      ))}
    </div>
  );
}

export function TableLoadingSkeleton({ rows = 5, columns = 4 }) {
  return (
    <table className="w-full">
      <tbody>
        {Array(rows).fill(0).map((_, i) => (
          <tr key={i} className="border-b">
            {Array(columns).fill(0).map((_, j) => (
              <td key={j} className="p-4">
                <div className="bg-gray-200 h-6 rounded animate-pulse"></div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ButtonSkeleton() {
  return <div className="bg-gray-200 h-10 rounded animate-pulse w-24"></div>;
}
