import { LaunchList } from "./launchList";
import { Map } from "./map";
import { useEffect, useState } from "react";
import { SpaceX } from "../api/spacex";

function App() {
    const [launches, setLaunches] = useState([]);
    const [launchpads, setLaunchpads] = useState([]);
    const [hoveredLaunch, setHoveredLaunch] = useState(null);
    const [error, setError] = useState(null);
    const launchesWithLaunchpads = new Set(
        launches.map(launch => launch.launchpad).filter(id => id != null).map(String)
    );
    const listedLaunchpads = launchpads.filter(launchpad =>
        launchesWithLaunchpads.has(String(launchpad.id))
    );

    useEffect(() => {
        const spacex = new SpaceX();

        Promise.all([spacex.launches(), spacex.launchpads()])
            .then(([launchData, launchpadData]) => {
                setLaunches(launchData);
                setLaunchpads(launchpadData);
            })
            .catch(loadError => {
                console.error("Failed to load launch data", loadError);
                setError(`Unable to load launch data: ${loadError.message}`);
            });
    }, []);

    return (
        <main className='main'>
            <section className="launches">
                {error && <p role="alert">{error}</p>}
                <LaunchList
                    launches={launches}
                    onLaunchHover={setHoveredLaunch}
                    onLaunchLeave={() => setHoveredLaunch(null)}
                />
                {hoveredLaunch && !hoveredLaunch.launchpad && (
                    <p role="status">Для этого запуска площадка не указана.</p>
                )}
            </section>
            <Map launchpads={listedLaunchpads} activeLaunchpadId={hoveredLaunch?.launchpad} />
        </main>
    )
}

export { App };
