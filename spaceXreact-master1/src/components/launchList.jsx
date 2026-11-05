function LaunchList({ launches, onLaunchHover, onLaunchLeave }) {
    return (
        <aside className="aside" id="launchesContainer">
            <h3>Launches</h3>
            <div id="listContainer">
                <ul className="launch-list">
                    {launches.map(launch => (
                        <li key={launch.id}>
                            <div
                                className="launch-item"
                                onMouseEnter={() => onLaunchHover(launch)}
                                onMouseLeave={onLaunchLeave}
                            >
                                {launch.name}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    )
}

export { LaunchList }
