import CreateGroup from '@/src/modules/groups/create-group';

// Placeholder user info (replace with real user data)
const user = {
  username: 'john_doe',
  avatar: '/images/avatar.png',
};

const privacyOptions = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
];

export default function CreateGroupPage() {
  const [groupName, setGroupName] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const fileInputRef = useRef();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const isFormValid = groupName.trim().length > 0;

  return (
    <div className="flex min-h-screen flex-col gap-8 bg-neutral-50 p-6 dark:bg-neutral-900 lg:flex-row">
      {/* Left: Form Section */}
      <div className="mx-auto flex w-full max-w-lg flex-col space-y-4 rounded-xl bg-white p-8 shadow-md dark:bg-zinc-900 lg:mx-0 lg:w-1/2">
        <h1 className="mb-2 text-2xl font-bold text-zinc-800 dark:text-zinc-100">Create Group</h1>
        {/* User Info Block */}
        <div className="mb-2 flex items-center gap-4">
          <Image
            src={user.avatar}
            alt={user.username}
            width={48}
            height={48}
            className="rounded-full border border-zinc-200 object-cover dark:border-zinc-700"
          />
          <div>
            <div className="font-semibold text-zinc-800 dark:text-zinc-100">{user.username}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Admin</div>
          </div>
        </div>
        {/* Group Name Input */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Group Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 font-semibold text-zinc-800 placeholder-zinc-500 outline-none transition-colors focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-700"
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />
        </div>
        {/* Privacy Selector */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Privacy
          </label>
          <select
            className="w-full rounded-md border border-zinc-300 bg-zinc-100 px-3 py-2 font-semibold text-zinc-800 outline-none transition-colors focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-700"
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value)}
          >
            {privacyOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {/* Group Description */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Description
          </label>
          <textarea
            className="min-h-[80px] w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 font-semibold text-zinc-800 placeholder-zinc-500 outline-none transition-colors focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-700"
            placeholder="Describe your group (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        {/* Create Button */}
        <button
          className={`mt-2 w-full rounded-lg bg-zinc-800 py-2 text-base font-bold text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 dark:bg-zinc-100 dark:text-neutral-800 dark:focus:ring-offset-zinc-900 ${
            isFormValid
              ? 'hover:bg-zinc-700 dark:hover:bg-zinc-400 dark:hover:text-zinc-50'
              : 'cursor-not-allowed opacity-60 hover:bg-zinc-800 dark:hover:bg-zinc-100'
          }`}
          disabled={!isFormValid}
        >
          Create
        </button>
      </div>
      {/* Right: Live Preview Section */}
      <div className="flex w-full items-start justify-center lg:w-1/2">
        <div className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-neutral-100 p-8 shadow-md dark:bg-zinc-900">
          {/* Group Avatar Upload Box */}
          <div
            className="group relative flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-100 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-500"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Group Avatar" fill className="rounded-lg object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
                <i className="fa-solid fa-image mb-2 text-4xl"></i>
                <span className="text-sm">Upload Group Cover</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          {/* Group Name Preview */}
          <div className="min-h-[28px] text-xl font-semibold text-zinc-800 dark:text-zinc-100">
            {groupName || <span className="text-zinc-400 dark:text-zinc-500">Group Name</span>}
          </div>
          {/* Privacy Badge */}
          <div className="inline-block w-fit rounded-full bg-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {privacyOptions.find((opt) => opt.value === privacy)?.label}
          </div>
          {/* Description Preview */}
          <div className="min-h-[40px] font-semibold text-zinc-600 dark:text-zinc-300">
            {description || (
              <span className="text-zinc-400 dark:text-zinc-500">
                Group description will appear here.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
