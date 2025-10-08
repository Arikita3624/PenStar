const Header = () => {
  return (
    <header className="bg-white shadow-md p-4 flex justify-end items-center">
      <div>
        <span className="mr-4">Welcome, Admin</span>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
