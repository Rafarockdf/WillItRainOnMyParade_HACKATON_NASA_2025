export async function POST(req: Request) {
    try {
        const data = await req.json();
        console.log("Collected data for download:", data);

        const infoCSV = `Variable Code,Long Name,Detailed Description,Unit,Data Collection,Data Source Link
        QLML,Surface Specific Humidity,Instantaneous specific humidity at the land surface.,kg kg-1,MERRA-2 M2I1NXLFO,https://disc.gsfc.nasa.gov/datasets/M2I1NXLFO_5.12.4/summary
        TLML,Surface Air Temperature,Instantaneous air temperature at the surface over land.,K,MERRA-2 M2I1NXLFO,https://disc.gsfc.nasa.gov/datasets/M2I1NXLFO_5.12.4/summary
        SPEEDLML,Surface Wind Speed,Instantaneous wind speed at the land surface.,m s-1,MERRA-2 M2I1NXLFO,https://disc.gsfc.nasa.gov/datasets/M2I1NXLFO_5.12.4/summary
        PRECTOTCORR,Bias-Corrected Total Precipitation,Total precipitation that has been bias-corrected. This field is the result of correcting the model-generated precipitation totals with observation data.,kg m-2 s-1,M2T1NXFLX,https://disc.gsfc.nasa.gov/datasets/M2T1NXFLX_5.12.4/summary
        TQV,Total Precipitable Water Vapor,Total precipitable water vapor in the atmospheric column.,kg m-2,M2T1NXSLV,https://disc.gsfc.nasa.gov/datasets/M2T1NXSLV_5.12.4/summary`;

        // Generate CSV combining info data with forecast data
        const csvContent = `${infoCSV}\n\nForecast Data:\n${JSON.stringify(data, null, 2)}`;

        return new Response(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename=forecast-data.csv',
            },
        });
    } catch (error) {
        console.error('Error processing download request:', error);
        return new Response(JSON.stringify({ error: 'Failed to process download' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}